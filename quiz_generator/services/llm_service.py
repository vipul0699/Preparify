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

class LLMService:
    def __init__(self):
        self.llm = ChatGroq(
            api_key=settings.GROQ_API_KEY,
            model="llama-3.3-70b-versatile",
            temperature=0.7
        )
        
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

llm_service = LLMService()
