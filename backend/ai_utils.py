import os
import openai
from googleapiclient.discovery import build
from dotenv import load_dotenv

load_dotenv()

# Initialize OpenAI
openai.api_key = os.getenv('OPENAI_API_KEY')
if not openai.api_key:
    print("Warning: OPENAI_API_KEY not found in environment variables")

# Initialize YouTube API client
YOUTUBE_API_KEY = os.getenv('YOUTUBE_API_KEY')
youtube = build('youtube', 'v3', developerKey=YOUTUBE_API_KEY)

def get_ai_response(prompt):
    """
    Get a response from OpenAI
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
    Get a video recommendation from YouTube based on the user's major
    """
    try:
        # Search for educational videos related to the course
        # Clean up the course name and add relevant educational terms
        search_query = f"{major} course lecture tutorial concepts"
        request = youtube.search().list(
            part="snippet",
            q=search_query,
            type="video",
            videoEmbeddable="true",
            maxResults=3,
            relevanceLanguage="en",
            safeSearch="strict"
        )
        response = request.execute()

        if not response.get('items'):
            return None

        videos = []
        for video in response['items']:
            video_id = video['id']['videoId']
            video_title = video['snippet']['title']
            video_url = f"https://www.youtube.com/watch?v={video_id}"
            thumbnail_url = video['snippet']['thumbnails']['high']['url']
            
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