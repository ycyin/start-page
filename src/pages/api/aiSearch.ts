export const prerender = false

import type { APIRoute } from "astro";
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = import.meta.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// Google Custom Search JSON API credentials
const googleSearchApiKey = import.meta.env.GOOGLE_SEARCH_API_KEY;
const googleSearchEngineId = import.meta.env.GOOGLE_SEARCH_ENGINE_ID;

export const GET: APIRoute = async ({ request }) => {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  const getResults = searchParams.get("results") === "true";
  
  if (!query) {
    return new Response(JSON.stringify({ error: "Missing query parameter" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // If we need to get search results first
    if (getResults) {
      // Fetch top 5 search results from Google CSE
      const searchResults = await fetchGoogleSearchResults(query);
      
      if (searchResults.length === 0) {
        // Fallback to just using AI if search results failed
        const response = await model.generateContent(query);
        const aiResponse = response.response.text().trim();
        return new Response(JSON.stringify({ result: aiResponse }), {
          headers: { "Content-Type": "application/json" },
        });
      }
      
      // Ask AI to choose the best result
      const promptWithResults = `Based on the following search results for "${query}", which one is the most relevant and useful? Return ONLY the URL of the best result without any additional text.
      
Results:
${searchResults.map((r, i) => `${i+1}. Title: ${r.title}
   URL: ${r.link}
   Snippet: ${r.snippet || 'N/A'}
`).join('\n')}`;

      const response = await model.generateContent(promptWithResults);
      const bestUrl = response.response.text().trim();
      
      return new Response(JSON.stringify({ 
        result: bestUrl,
        allResults: searchResults 
      }), {
        headers: { "Content-Type": "application/json" },
      });
    } else {
      // Original behavior - just get AI suggestion
      const response = await model.generateContent(query);
      const aiResponse = response.response.text().trim();
      return new Response(JSON.stringify({ result: aiResponse }), {
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

// Function to fetch search results using Google Custom Search JSON API
async function fetchGoogleSearchResults(query) {
  try {
    const url = new URL('https://www.googleapis.com/customsearch/v1');
    url.searchParams.append('key', googleSearchApiKey);
    url.searchParams.append('cx', googleSearchEngineId);
    url.searchParams.append('q', query);
    url.searchParams.append('num', '5');  // Get top 5 results

    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`Google Search API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.items || data.items.length === 0) {
      return [];
    }
    
    // Transform the results to a simpler format
    return data.items.map(item => ({
      title: item.title,
      link: item.link,
      snippet: item.snippet || ''
    }));
  } catch (error) {
    console.error("Error fetching Google search results:", error);
    return [];
  }
}