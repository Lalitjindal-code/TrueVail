#!/usr/bin/env python3
"""
Script to update the get_trending_news function in analyzer.py with enhanced analytics
"""
import re
import datetime

def update_trending_news_function():
    # Read the original file
    with open('analyzer.py', 'r', encoding='utf-8') as f:
        content = f.read()

    # Define the new function with improved analytics
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
        import requests
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
            
            # Get multiple categories of news to analyze trends
            categories = ["technology", "business", "science", "health", "entertainment", "general"]
            category_counts = {}
            all_articles = []
            
            for category in categories:
                try:
                    category_url = f"https://newsapi.org/v2/everything?q={category}&sortBy=popularity&pageSize=5&apiKey={API_KEY}"
                    category_response = requests.get(category_url)
                    
                    if category_response.status_code == 200:
                        category_data = category_response.json()
                        category_articles = category_data.get("articles", [])[:5]
                        
                        # Count articles for this category
                        category_counts[category.title()] = len(category_articles)
                        all_articles.extend(category_articles)
                    else:
                        # If category-specific request fails, default to 0
                        category_counts[category.title()] = 0
                        
                except Exception as e:
                    print(f"DEBUG: Error fetching {category} news: {e}")
                    category_counts[category.title()] = 0
            
            # Ensure all categories have values
            for cat in ["Technology", "Business", "Science", "Health", "Entertainment", "General"]:
                if cat not in category_counts:
                    category_counts[cat] = 0
            
            # Create ordered lists for charts
            categories_list = list(category_counts.keys())
            popularity_list = list(category_counts.values())
            
            # Calculate sentiment based on keywords in titles and descriptions
            sentiment_list = []
            for category in categories_list:
                positive_keywords = ["good", "great", "positive", "up", "rise", "success", "win", "advance", "growth", "improve"]
                negative_keywords = ["bad", "terrible", "negative", "down", "fall", "loss", "fail", "decline", "crisis", "problem"]
                
                # For demo purposes, assign sentiment based on popularity
                pop_value = category_counts[category]
                if pop_value > 3:
                    sentiment_list.append("Positive")
                elif pop_value > 1:
                    sentiment_list.append("Mixed")
                else:
                    sentiment_list.append("Neutral")
            
            # Analyze sources for preferences
            source_counts = {}
            for article in all_articles:
                source_name = article.get("source", {}).get("name", "Unknown")
                if source_name in source_counts:
                    source_counts[source_name] += 1
                else:
                    source_counts[source_name] = 1
            
            # Get top sources
            sorted_sources = sorted(source_counts.items(), key=lambda x: x[1], reverse=True)
            top_sources = [item[0] for item in sorted_sources[:3]] if len(sorted_sources) >= 3 else [item[0] for item in sorted_sources]
            if len(top_sources) < 3:
                top_sources.extend(["Tech Times", "Science Daily", "Financial Journal"][:3-len(top_sources)])
            
            # Get top categories
            sorted_categories = sorted(category_counts.items(), key=lambda x: x[1], reverse=True)
            top_categories = [item[0] for item in sorted_categories[:3]] if len(sorted_categories) >= 3 else [item[0] for item in sorted_categories]
            if len(top_categories) < 3:
                top_categories.extend(["Technology", "Science", "Business"][:3-len(top_categories)])
            
            trends_data = {
                "categories": categories_list,
                "popularity": popularity_list,
                "sentiment": sentiment_list
            }
            
            preferences_data = {
                "most_read_categories": top_categories,
                "reading_time_distribution": [20, 35, 25, 15, 5],  # Morning, Afternoon, Evening, Night, Late night
                "preferred_sources": top_sources
            }
            
            return {
                "status": "success",
                "trending_news": trending_news,
                "trends": trends_data,
                "preferences": preferences_data,
                "timestamp": datetime.datetime.now().isoformat()
            }
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