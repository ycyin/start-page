## Browser Start Page + GitHub Issues Bookmark Manager

A beautiful and practical browser start page based on [aesthetic-startpage](https://github.com/stefan-yas/aesthetic-startpage), with added GitHub Issues bookmark management functionality.

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

### GitHub Issues Bookmark Management
- **Issue-based bookmark storage**: Use GitHub Issues as a bookmark database, no need to maintain an additional database
- **Rich metadata**: Support for title, description, tags, thumbnails and other metadata
- **Powerful search and filtering**: Support for full-text search and tag filtering
- **Responsive design**: Adapts to various device sizes
- **Automatic synchronization**: Changes on GitHub automatically sync to the website

## Usage

### Adding New Bookmarks
1. Create a new Issue in the GitHub repository
2. Use the provided bookmark template to fill in information
3. After submitting the Issue, the website will automatically update to display the new bookmark

### Searching and Filtering Bookmarks
- Use the search box to search titles and descriptions
- Click on tags to filter related bookmarks
- Click "Clear Filters" to reset all filter conditions

## Deployment Instructions
1. Fork this repository
2. Deploy via Vercel or similar service
3. Set the following environment variables:
   - `GITHUB_OWNER`: GitHub username
   - `GITHUB_REPO`: Repository name
   - `GITHUB_TOKEN`: GitHub access token (optional, for private repositories or higher API limits)
   - `GEMINI_API_KEY`, `GOOGLE_SEARCH_API_KEY`, `GOOGLE_SEARCH_ENGINE_ID`: Required for AI search functionality

## Local Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Visit http://localhost:4321/github to view the bookmarks page
