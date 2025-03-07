## Terminal-like Web Interface

A beatiful and aesthetic start page for your browser that i made for myself based on this [aesthetic-startpage](https://github.com/stefan-yas/aesthetic-startpage). 

https://github.com/user-attachments/assets/5b2821f3-ddb9-4e37-92c9-7e6d2abc6ab1

## Features

### Interactive Terminal Input
- **Placeholder Typing Effect**: The input field displays a typing effect with example queries.
- **Keyboard Shortcuts**:
  - `Ctrl + C`: Clears the input field.
  - `Arrow Up/Down`: Navigates through command history.
  - `Enter`: Executes the command or query.
  
- **Special Commands**:
  - `r:<query>`: Searches Reddit using Google.
  - `m:<query>`: Searches MyAnimeList using Google.
  - `a:<query>`: Performs an AI-based search (requires backend API).
  - Direct URL input: Navigates directly to the entered URL.

### AI Search Integration
- You can search with `a:<query>` and ai will find the most suitable website based on your query and directly go to that website.
- This uses *gemini-2.0-flash* and Google Programmable Search Engine Id and Api. 

### Accessibility and Usability
- **Autofocus**: Automatically focuses the input field when the page loads.
- **Keydown Event**: Focuses the input field when any key is pressed.

## Deployment
Just Fork this repository and deploy it via a site like vercel.

**DO NOT FORGET TO ADD ENVIROMENT VARIABLES GEMINI_API_KEY, GOOGLE_SEARCH_API_KEY, GOOGLE_SEARCH_ENGINE_ID** 
