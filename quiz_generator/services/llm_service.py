import json
from django.conf import settings
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from pydantic import BaseModel, Field
from typing import List

# We define Pydantic models for structured output
class QuestionOutput(BaseModel):
    text: str = Field(description="The question text")
    difficulty: str = Field(description="The difficulty level: Easy, Medium, or Hard")
    correct_answer: str = Field(description="The correct answer to the question")
    explanation: str = Field(description="A brief explanation of why this answer is correct")

class QuestionList(BaseModel):
    questions: List[QuestionOutput]

class EvaluationOutput(BaseModel):
    score: int = Field(description="A score between 0 and 100")
    feedback: str = Field(description="Detailed feedback on the user's answer")
    is_correct: bool = Field(description="Whether the answer is considered correct")

class GapAnalysisOutput(BaseModel):
    gap_analysis: str = Field(description="A deep conceptual breakdown of why the user missed certain questions and their overall knowledge gaps.")
    study_focus: List[str] = Field(description="A list of 3-5 specific topics or concepts the user should focus on next.")

# Exam related models
class ExamQuestionParsed(BaseModel):
    text: str = Field(description="The question text")
    type: str = Field(description="MCQ or TITA")
    options: List[str] = Field(description="List of options for MCQ, empty for TITA", default=[])
    correct_answer: str = Field(description="The correct answer")
    marks: int = Field(description="Marks for this question (default 3)", default=3)
    penalty: int = Field(description="Penalty for wrong answer (default 1 for MCQ, 0 for TITA)", default=1)
    explanation: str = Field(description="Brief explanation", default="")

class ExamQuestionGroupParsed(BaseModel):
    title: str = Field(description="Title of the passage/set")
    context_text: str = Field(description="The passage text or DI set data")
    questions: List[ExamQuestionParsed]

class ExamSectionParsed(BaseModel):
    name: str = Field(description="Section name (VARC, DILR, QA)")
    groups: List[ExamQuestionGroupParsed] = Field(description="Groups of questions (passages/sets)", default=[])
    standalone_questions: List[ExamQuestionParsed] = Field(description="Questions not part of any group", default=[])

class ExamParsed(BaseModel):
    name: str = Field(description="Exam name")
    exam_type: str = Field(description="CAT, UPSC, etc.")
    duration_minutes: int = Field(description="Total duration")
    sections: List[ExamSectionParsed]

class PercentileOutput(BaseModel):
    percentile: float = Field(description="The predicted percentile (0.0 to 100.0)")
    analysis: str = Field(description="Brief analysis of why this percentile was predicted based on difficulty.")

class LLMService:
    def __init__(self):
        self.llm = ChatGroq(
            api_key=settings.GROQ_API_KEY,
            model="llama-3.3-70b-versatile",
            temperature=0.7
        )
        
    def parse_exam_paper(self, text_content: str, exam_type: str = "CAT") -> dict:
        """
        Parse raw text from a PDF into a structured Exam JSON.
        """
        parser = JsonOutputParser(pydantic_object=ExamParsed)
        
        prompt_text = """
        You are an expert exam paper parser. Parse the following raw text from a {exam_type} past paper into a structured JSON format.
        
        Rules:
        1. Identify Sections (e.g., VARC, DILR, QA for CAT).
        2. Identify Reading Comprehension (RC) passages and Data Interpretation (DI) sets as 'groups'.
        3. Identify individual questions within those groups or as standalone.
        4. Detect question type (MCQ or TITA/Non-MCQ).
        5. Extract options and correct answers if present in text.
        
        Text Content:
        {text}
        
        Return strictly JSON.
        \n{format_instructions}
        """
        
        prompt = ChatPromptTemplate.from_template(prompt_text)
        chain = prompt | self.llm | parser
        
        try:
            # We might need to chunk large papers, but for now let's try direct
            # If text is too long, we only take first 30k chars for testing
            result = chain.invoke({
                "exam_type": exam_type,
                "text": text_content[:30000], 
                "format_instructions": parser.get_format_instructions()
            })
            return result
        except Exception as e:
            print(f"Error parsing exam: {e}")
            return {}

    def generate_mock_exam(self, exam_type: str = "CAT") -> dict:
        """
        Generate a full-length high-quality mock exam.
        """
        # For a full mock, we'd need multiple LLM calls. 
        # For Phase 1, we'll generate a "Mini Mock" (1 passage, 1 DI set, 2 QA questions).
        parser = JsonOutputParser(pydantic_object=ExamParsed)
        
        prompt_text = """
        You are a high-end exam content creator for {exam_type}. 
        Generate a high-difficulty, realistic "Mini Mock" exam.
        
        Include:
        - 1 VARC Section with 1 complex Reading Comprehension passage and 3 questions.
        - 1 DILR Section with 1 logical Data Interpretation set and 3 questions.
        - 1 QA Section with 4 challenging standalone questions (mix of MCQ and TITA).
        
        Ensure questions follow {exam_type} standards precisely.
        
        Return strictly JSON.
        \n{format_instructions}
        """
        
        prompt = ChatPromptTemplate.from_template(prompt_text)
        chain = prompt | self.llm | parser
        
        try:
            result = chain.invoke({
                "exam_type": exam_type,
                "format_instructions": parser.get_format_instructions()
            })
            return result
        except Exception as e:
            print(f"Error generating mock: {e}")
            return {}

    def calculate_percentile(self, exam_name: str, score: float, total_marks: int) -> dict:
        """
        Predict percentile based on score and exam difficulty.
        """
        parser = JsonOutputParser(pydantic_object=PercentileOutput)
        
        prompt_text = """
        Predict the {exam_name} percentile for a score of {score} out of {total_marks}.
        
        Consider the historical difficulty and scoring trends of {exam_name}.
        Provide a realistic percentile and a brief one-sentence analysis.
        
        Return strictly JSON.
        \n{format_instructions}
        """
        
        prompt = ChatPromptTemplate.from_template(prompt_text)
        chain = prompt | self.llm | parser
        
        try:
            result = chain.invoke({
                "exam_name": exam_name,
                "score": score,
                "total_marks": total_marks,
                "format_instructions": parser.get_format_instructions()
            })
            return result
        except Exception as e:
            print(f"Error calculating percentile: {e}")
            return {"percentile": 0.0, "analysis": "Error in calculation"}

    def generate_questions(self, topic: str, difficulty: str, context: str = "") -> List[dict]:
        """
        Generate questions based on topic and context.
        """
        parser = JsonOutputParser(pydantic_object=QuestionList)
        
        prompt_text = """
        You are a quiz master. Generate 3 {difficulty} questions about the topic: {topic}.
        
        For each question, provide a clear and concise explanation of why the correct answer is right.
        
        Use the following context if relevant:
        {context}
        
        Return the response strictly in JSON format matching the schema.
        \n{format_instructions}
        """
        
        prompt = ChatPromptTemplate.from_template(prompt_text)
        
        chain = prompt | self.llm | parser
        
        try:
            result = chain.invoke({
                "topic": topic,
                "difficulty": difficulty,
                "context": context,
                "format_instructions": parser.get_format_instructions()
            })
            return result.get("questions", [])
        except Exception as e:
            print(f"Error generating questions: {e}")
            # Fallback mock for safety/testing without API key
            return [
                {"text": f"Mock Question 1 about {topic}", "difficulty": difficulty, "correct_answer": "Mock Answer"}
            ]

    def evaluate_answer(self, question_text: str, correct_answer: str, user_answer: str) -> dict:
        """
        Evaluate user answer.
        """
        parser = JsonOutputParser(pydantic_object=EvaluationOutput)
        
        prompt_text = """
        Evaluate the user's answer to the following question.
        
        Question: {question}
        Correct Answer Context: {correct_answer}
        User Answer: {user_answer}
        
        Provide a score (0-100), feedback, and a boolean is_correct.
        \n{format_instructions}
        """
        
        prompt = ChatPromptTemplate.from_template(prompt_text)
        
        chain = prompt | self.llm | parser
        
        try:
            result = chain.invoke({
                "question": question_text,
                "correct_answer": correct_answer,
                "user_answer": user_answer,
                "format_instructions": parser.get_format_instructions()
            })
            return result
        except Exception as e:
            print(f"Error evaluating answer: {e}")
            return {"score": 0, "feedback": f"Error in evaluation: {e}", "is_correct": False}

    def generate_gap_analysis(self, topic: str, performance_data: List[dict]) -> dict:
        """
        Generate a personalized Gap Analysis report based on quiz performance.
        """
        parser = JsonOutputParser(pydantic_object=GapAnalysisOutput)
        
        prompt_text = """
        You are an expert academic advisor. Analyze the following quiz performance data for the topic: {topic}.
        
        Performance Data:
        {performance_data}
        
        Identify why the user missed questions (e.g., lack of fundamentals, calculation errors, conceptual misunderstandings).
        Provide a deep conceptual breakdown (gap_analysis) and a list of specific study focus areas (study_focus).
        
        Return the response strictly in JSON format matching the schema.
        \n{format_instructions}
        """
        
        prompt = ChatPromptTemplate.from_template(prompt_text)
        
        chain = prompt | self.llm | parser
        
        try:
            result = chain.invoke({
                "topic": topic,
                "performance_data": json.dumps(performance_data),
                "format_instructions": parser.get_format_instructions()
            })
            return result
        except Exception as e:
            print(f"Error generating gap analysis: {e}")
            return {
                "gap_analysis": "An error occurred while generating your report. Please try again later.",
                "study_focus": []
            }

    def generate_personalized_topics(self, existing_topics: List[str]) -> List[str]:
        """
        Generate related topics based on user's past quiz history.
        """
        if not existing_topics:
            return []

        prompt_text = """
        The user has recently taken quizzes on the following topics: {topics}.
        
        Generate a list of 25 related but diverse academic, professional, or STEM topics that would pique their interest. 
        Think of topics that are extensions, related fields, or advanced concepts of the ones provided.
        
        Return ONLY a JSON list of strings.
        Example: ["Quantum Computing", "Linear Algebra", "Corporate Finance"]
        """
        
        prompt = ChatPromptTemplate.from_template(prompt_text)
        
        # Simple string-list output for this one
        try:
            result = self.llm.invoke(prompt.format(topics=", ".join(existing_topics)))
            # Extract content and try to parse JSON
            content = result.content
            # Basic cleaning in case LLM adds markdown or chatter
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                content = content.split("```")[1].split("```")[0].strip()
            
            topics = json.loads(content)
            print(topics)
            if isinstance(topics, list):
                return [str(t) for t in topics]
            return []
        except Exception as e:
            print(f"Error generating personalized topics: {e}")
            return []

llm_service = LLMService()
