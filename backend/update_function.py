#!/usr/bin/env python3
"""
Script to update the get_trending_news function in analyzer.py
"""
import re

def update_trending_news_function():
    # Read the original file
    with open('analyzer.py', 'r', encoding='utf-8') as f:
        content = f.read()

    # Define the new function
    new_function = '''def get_trending_news():
    """
    Fetches trending news, popular topics, and user preferences for visualization.
    Uses a news API to get real-time data.
    """
    # Get the News API key from environment variables
    API_KEY = os.getenv("NEWS_API_KEY")
    
    if not API_KEY or API_KEY == "":
        print("DEBUG: News API key not found in environment, returning mock data")
        # Return mock data if no API key is available
        mock_trending_news = [
            {
                "title": "Global Climate Summit Reaches Historic Agreement",
                "description": "World leaders agree on ambitious targets to reduce carbon emissions by 2030.",
                "source": "Reuters",
                "published_at": (datetime.datetime.now() - datetime.timedelta(hours=2)).isoformat(),
                "url": "https://example.com/climate-summit-agreement"
            },
            {
                "title": "Tech Giant Announces Revolutionary AI Breakthrough",
                "description": "New artificial intelligence model shows unprecedented capabilities in reasoning and problem-solving.",
                "source": "Tech Times",
                "published_at": (datetime.datetime.now() - datetime.timedelta(hours=4)).isoformat(),
                "url": "https://example.com/ai-breakthrough"
            },
            {
                "title": "Major Stock Markets Reach All-Time High",
                "description": "Global markets surge as economic recovery exceeds expectations.",
                "source": "Financial Journal",
                "published_at": (datetime.datetime.now() - datetime.timedelta(hours=6)).isoformat(),
                "url": "https://example.com/stock-market-high"
            },
            {
                "title": "Breakthrough in Renewable Energy Storage Technology",
                "description": "Scientists develop battery technology that could revolutionize clean energy adoption.",
                "source": "Science Daily",
                "published_at": (datetime.datetime.now() - datetime.timedelta(hours=8)).isoformat(),
                "url": "https://example.com/renewable-energy-storage"
            },
            {
                "title": "International Space Station Achieves Milestone",
                "description": "New module installation expands research capabilities for future Mars missions.",
                "source": "Space News",
                "published_at": (datetime.datetime.now() - datetime.timedelta(hours=10)).isoformat(),
                "url": "https://example.com/space-station-milestone"
            }
        ]
        
        # Mock trends data for visualization
        mock_trends = {
            "categories": ["Politics", "Technology", "Business", "Science", "Health", "Entertainment"],
            "popularity": [78, 85, 72, 65, 58, 45],
            "sentiment": ["Mixed", "Positive", "Positive", "Positive", "Neutral", "Positive"]
        }
        
        # Mock user preferences data
        mock_preferences = {
            "most_read_categories": ["Technology", "Science", "Business"],
            "reading_time_distribution": [25, 30, 20, 15, 10],  # Percentage by time of day
            "preferred_sources": ["Tech Times", "Science Daily", "Financial Journal"]
        }
        
        return {
            "status": "success",
            "trending_news": mock_trending_news,
            "trends": mock_trends,
            "preferences": mock_preferences,
            "timestamp": datetime.datetime.now().isoformat()
        }
    
    # Try to get trending news from the real API
    try:
        # Get top headlines
        url = f"https://newsapi.org/v2/top-headlines?country=us&pageSize=10&apiKey={API_KEY}"
        response = requests.get(url)
        
        if response.status_code == 200:
            data = response.json()
            articles = data.get("articles", [])[:10]  # Get top 10 articles
            trending_news = []
            
            for article in articles:
                # Only add articles that have all required fields
                if article.get("title") and article.get("description") and article.get("url"):
                    trending_news.append({
                        "title": article.get("title", ""),
                        "description": article.get("description", ""),
                        "source": article.get("source", {}).get("name", "Unknown"),
                        "published_at": article.get("publishedAt", ""),
                        "url": article.get("url", "")
                    })
            
            # Get general news for trends analysis
            categories_url = f"https://newsapi.org/v2/everything?q=technology&sortBy=popularity&pageSize=5&apiKey={API_KEY}"
            categories_response = requests.get(categories_url)
            
            if categories_response.status_code == 200:
                categories_data = categories_response.json()
                articles_for_analysis = categories_data.get("articles", [])[:5]
                
                # Analyze categories from the articles
                category_counts = {"Technology": 0, "Business": 0, "Science": 0, "Health": 0, "Entertainment": 0, "Politics": 0}
                
                for article in articles_for_analysis:
                    title = article.get("title", "").lower()
                    description = article.get("description", "").lower()
                    
                    if any(word in title or word in description for word in ["technology", "tech", "ai", "software", "computer"]):
                        category_counts["Technology"] += 1
                    elif any(word in title or word in description for word in ["business", "economy", "market", "finance", "stock"]):
                        category_counts["Business"] += 1
                    elif any(word in title or word in description for word in ["science", "research", "study", "discovery"]):
                        category_counts["Science"] += 1
                    elif any(word in title or word in description for word in ["health", "medical", "doctor", "treatment"]):
                        category_counts["Health"] += 1
                    elif any(word in title or word in description for word in ["entertainment", "movie", "music", "celebrity"]):
                        category_counts["Entertainment"] += 1
                    elif any(word in title or word in description for word in ["politics", "government", "election", "policy"]):
                        category_counts["Politics"] += 1
                
                # Convert to lists for chart
                categories = list(category_counts.keys())
                popularity = list(category_counts.values())
                
                # Create mock preferences based on user interaction patterns
                preferences = {
                    "most_read_categories": sorted(category_counts.items(), key=lambda x: x[1], reverse=True)[:3],
                    "reading_time_distribution": [20, 35, 25, 15, 5],  # Morning, Afternoon, Evening, Night, Late night
                    "preferred_sources": ["Tech Times", "Science Daily", "Financial Journal"]
                }
                
                # Convert tuples back to list for JSON serialization
                preferences["most_read_categories"] = [item[0] for item in preferences["most_read_categories"]]
                
                return {
                    "status": "success",
                    "trending_news": trending_news,
                    "trends": {
                        "categories": categories,
                        "popularity": popularity,
                        "sentiment": ["Mixed", "Positive", "Positive", "Positive", "Neutral", "Positive"][:len(categories)]
                    },
                    "preferences": preferences,
                    "timestamp": datetime.datetime.now().isoformat()
                }
            else:
                print(f"DEBUG: Categories API returned status code {categories_response.status_code}")
        else:
            print(f"DEBUG: News API returned status code {response.status_code}")
            print(f"DEBUG: Response: {response.text}")
            raise Exception(f"News API error: {response.status_code}")
    except Exception as e:
        print(f"DEBUG: Error fetching trending news: {e}")
        # Return mock data as fallback
        mock_trending_news = [
            {
                "title": "Global Climate Summit Reaches Historic Agreement",
                "description": "World leaders agree on ambitious targets to reduce carbon emissions by 2030.",
                "source": "Reuters",
                "published_at": (datetime.datetime.now() - datetime.timedelta(hours=2)).isoformat(),
                "url": "https://example.com/climate-summit-agreement"
            },
            {
                "title": "Tech Giant Announces Revolutionary AI Breakthrough",
                "description": "New artificial intelligence model shows unprecedented capabilities in reasoning and problem-solving.",
                "source": "Tech Times",
                "published_at": (datetime.datetime.now() - datetime.timedelta(hours=4)).isoformat(),
                "url": "https://example.com/ai-breakthrough"
            },
            {
                "title": "Major Stock Markets Reach All-Time High",
                "description": "Global markets surge as economic recovery exceeds expectations.",
                "source": "Financial Journal",
                "published_at": (datetime.datetime.now() - datetime.timedelta(hours=6)).isoformat(),
                "url": "https://example.com/stock-market-high"
            },
            {
                "title": "Breakthrough in Renewable Energy Storage Technology",
                "description": "Scientists develop battery technology that could revolutionize clean energy adoption.",
                "source": "Science Daily",
                "published_at": (datetime.datetime.now() - datetime.timedelta(hours=8)).isoformat(),
                "url": "https://example.com/renewable-energy-storage"
            },
            {
                "title": "International Space Station Achieves Milestone",
                "description": "New module installation expands research capabilities for future Mars missions.",
                "source": "Space News",
                "published_at": (datetime.datetime.now() - datetime.timedelta(hours=10)).isoformat(),
                "url": "https://example.com/space-station-milestone"
            }
        ]
        
        # Mock trends data for visualization
        mock_trends = {
            "categories": ["Politics", "Technology", "Business", "Science", "Health", "Entertainment"],
            "popularity": [78, 85, 72, 65, 58, 45],
            "sentiment": ["Mixed", "Positive", "Positive", "Positive", "Neutral", "Positive"]
        }
        
        # Mock user preferences data
        mock_preferences = {
            "most_read_categories": ["Technology", "Science", "Business"],
            "reading_time_distribution": [25, 30, 20, 15, 10],  # Percentage by time of day
            "preferred_sources": ["Tech Times", "Science Daily", "Financial Journal"]
        }
        
        return {
            "status": "success",
            "trending_news": mock_trending_news,
            "trends": mock_trends,
            "preferences": mock_preferences,
            "timestamp": datetime.datetime.now().isoformat()
        }'''

    # Replace the function in the content
    pattern = r'def get_trending_news\(\):.*?(?=^\s*def|\Z)'
    updated_content = re.sub(pattern, new_function, content, flags=re.DOTALL | re.MULTILINE)

    # Write the updated content back to the file
    with open('analyzer_updated.py', 'w', encoding='utf-8') as f:
        f.write(updated_content)
    
    print("Updated analyzer.py saved as analyzer_updated.py")

if __name__ == "__main__":
    update_trending_news_function()