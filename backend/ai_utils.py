"""
AI Utilities Module
Provides integration with OpenAI for Q&A and YouTube for educational video recommendations.
Requires API keys to be set in .env file:
- OPENAI_API_KEY: For ChatGPT integration
- YOUTUBE_API_KEY: For video search functionality
"""

import os
import openai
from googleapiclient.discovery import build
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Initialize OpenAI with API key
openai.api_key = os.getenv('OPENAI_API_KEY')
if not openai.api_key:
    print("Warning: OPENAI_API_KEY not found in environment variables")

# Set up YouTube API client for video recommendations
YOUTUBE_API_KEY = os.getenv('YOUTUBE_API_KEY')
youtube = build('youtube', 'v3', developerKey=YOUTUBE_API_KEY)

def get_ai_response(prompt):
    """
    Generate an AI response using OpenAI's ChatGPT
    
    Args:
        prompt (str): User's question or message
        
    Returns:
        str: AI-generated response focused on educational guidance
        
    Note:
        Uses GPT-3.5-turbo with specific instructions to act as a supportive teacher,
        providing guidance rather than direct answers to encourage learning.
    """
    try:
        if not openai.api_key:
            print("Error: OpenAI API key not found")
            return "OpenAI API key not configured. Please set OPENAI_API_KEY in your environment."
            
        print("Attempting to get AI response for prompt:", prompt)
        # Create the chat completion
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a kind and supportive teacher who helps students succeed. Keep responses concise (3-4 sentences max). Be clear, encouraging, and practical. Use simple formatting - no markdown or special characters. Focus on giving actionable advice and clear explanations and also try not give the user the direct answer they are seeking rather seek to guide them to the correct answer."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=150,
            temperature=0.7
        )
        
        # Extract the response text
        return response.choices[0].message['content'].strip()
    except Exception as e:
        print(f"Error generating AI response: {str(e)}")
        return "I apologize, but I'm having trouble processing your request right now. Please try again later."

def get_video_recommendation(major):
    """
    Search YouTube for educational videos related to a specific course or major
    
    Args:
        major (str): Course name or major to search for
        
    Returns:
        list: List of dictionaries containing video information:
            - title: Video title
            - url: YouTube watch URL
            - thumbnail: High-quality thumbnail URL
            - description: Truncated video description
            
    Note:
        - Searches for course-specific educational content
        - Returns up to 3 most relevant results
        - Ensures videos are embeddable and safe for educational use
        - Truncates descriptions to 100 characters for readability
    """
    try:
        # Construct an education-focused search query
        search_query = f"{major} course lecture tutorial concepts"
        
        # Configure YouTube search parameters
        request = youtube.search().list(
            part="snippet",
            q=search_query,
            type="video",          # Only return videos (not playlists/channels)
            videoEmbeddable="true", # Ensure videos can be embedded
            maxResults=3,          # Limit to top 3 results
            relevanceLanguage="en", # English content only
            safeSearch="strict"    # Ensure content is appropriate
        )
        response = request.execute()

        if not response.get('items'):
            return None

        # Process and format video results
        videos = []
        for video in response['items']:
            video_id = video['id']['videoId']
            video_title = video['snippet']['title']
            video_url = f"https://www.youtube.com/watch?v={video_id}"
            thumbnail_url = video['snippet']['thumbnails']['high']['url']
            
            # Format video data for frontend display
            videos.append({
                "title": video_title,
                "url": video_url,
                "thumbnail": thumbnail_url,
                "description": video['snippet']['description'][:100] + '...' if len(video['snippet']['description']) > 100 else video['snippet']['description']
            })

        return videos
    except Exception as e:
        print(f"Error getting video recommendation for course '{major}': {str(e)}")
        if not YOUTUBE_API_KEY:
            print("YouTube API key is missing!")
        return None