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
            return "OpenAI API key not configured. Please set OPENAI_API_KEY in your environment."
            
        # Create the chat completion
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful AI tutor assistant focused on helping students learn effectively."},
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
        # Search for educational videos related to the major
        search_query = f"{major} study tutorial education"
        request = youtube.search().list(
            part="snippet",
            q=search_query,
            type="video",
            videoEmbeddable="true",
            maxResults=1,
            relevanceLanguage="en",
            safeSearch="strict"
        )
        response = request.execute()

        if not response.get('items'):
            return None

        video = response['items'][0]
        video_id = video['id']['videoId']
        video_title = video['snippet']['title']
        video_url = f"https://www.youtube.com/watch?v={video_id}"

        return {
            "title": video_title,
            "url": video_url
        }
    except Exception as e:
        print(f"Error getting video recommendation: {str(e)}")
        return None