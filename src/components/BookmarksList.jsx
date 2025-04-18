import React, { useState, useEffect } from 'react';

// 处理 GitHub Issue 内容
function parseMarkdown(text) {
  if (!text) return { url: '', description: '', tags: [] };
  
  // 清理模板注释和标记
  let cleanText = text
    // 移除 HTML 注释
    .replace(/<!--[\s\S]*?-->/g, '')
    // 移除 Markdown 标题 (##)
    .replace(/##\s+([^\n]+)/g, '')
    // 移除模板指导文本
    .replace(/请在此处填写[^\n]*/g, '')
    .replace(/请简要描述[^\n]*/g, '')
    .replace(/可选[^\n]*/g, '')
    .replace(/请添加相关标签[^\n]*/g, '')
    .trim();
  
  // 提取 URL
  let url = '';
  const urlSection = cleanText.match(/## URL[\s\S]*?(?=##|$)/);
  if (urlSection) {
    const urlMatch = urlSection[0].match(/https?:\/\/[^\s\n]+/);
    if (urlMatch) url = urlMatch[0];
  }
  
  // 提取描述
  let description = '';
  const descSection = cleanText.match(/## 描述[\s\S]*?(?=##|$)/);
  if (descSection) {
    const lines = descSection[0]
      .replace(/## 描述/, '')
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.includes('https://'));
    
    if (lines.length > 0) {
      description = lines.join(' ');
    }
  }
  
  // 如果没有描述，尝试提取第一个非空内容
  if (!description) {
    const lines = cleanText.split('\n')
      .map(line => line.trim())
      .filter(line => 
        line && 
        !line.startsWith('##') && 
        !line.includes('标签') && 
        !line.includes('缩略图') && 
        !line.includes('其他信息') &&
        !line.includes('https://')
      );
    
    if (lines.length > 0) {
      description = lines[0];
    }
  }
  
  // 提取标签
  let tags = [];
  const tagSection = cleanText.match(/## 标签[\s\S]*?(?=##|$)/);
  if (tagSection) {
    const tagLine = tagSection[0].replace(/## 标签/, '').trim();
    if (tagLine) {
      tags = tagLine.split(',').map(tag => tag.trim()).filter(Boolean);
    }
  }
  
  // 如果没有找到标签部分，尝试其他方式匹配
  if (tags.length === 0) {
    const tagsMatch = cleanText.match(/标签[：:][\s\n]*([^\n]+)/);
    if (tagsMatch) {
      tags = tagsMatch[1].split(',').map(tag => tag.trim()).filter(Boolean);
    }
  }
  
  return { url, description, tags };
}

// 书签类型定义
const BookmarksList = () => {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [allTags, setAllTags] = useState([]);

  // 加载数据
  useEffect(() => {
    const loadBookmarks = async () => {
      try {
        // 首先尝试从静态 JSON 文件加载数据
        const staticDataResponse = await fetch('/data/bookmarks.json');
        
        if (staticDataResponse.ok) {
          const data = await staticDataResponse.json();
          const lastUpdated = new Date(data.last_updated);
          const now = new Date();
          const hoursSinceUpdate = (now - lastUpdated) / (1000 * 60 * 60);
          
          // 如果静态数据存在且不超过 24 小时，使用静态数据
          if (data.bookmarks?.length > 0 && hoursSinceUpdate < 24) {
            console.log('Using static bookmarks data');
            processBookmarks(data.bookmarks);
            return;
          }
        }
        
        // 如果静态数据不可用或已过期，则调用 API
        console.log('Static data unavailable or outdated, fetching from API');
        const apiResponse = await fetch('/api/github-issues');
        if (!apiResponse.ok) throw new Error('API request failed');
        
        const apiData = await apiResponse.json();
        processBookmarks(apiData.bookmarks || []);
      } catch (err) {
        console.error('Error loading bookmarks:', err);
        setError('加载书签失败，请稍后重试');
        setLoading(false);
      }
    };
    
    // 处理书签数据
    const processBookmarks = (bookmarksData) => {
      setBookmarks(bookmarksData);
      
      // 提取所有标签
      const tags = new Set();
      bookmarksData.forEach(bookmark => {
        // 合并 labels 和 parsedTags
        const allTags = [...(bookmark.labels || []), ...(bookmark.tags || [])];
        allTags.forEach(tag => tags.add(tag));
      });
      setAllTags(Array.from(tags));
      
      setLoading(false);
    };
    
    loadBookmarks();
  }, []);

  // 处理和过滤书签
  const processedBookmarks = bookmarks.map(bookmark => {
    const parsed = parseMarkdown(bookmark.body || '');
    return {
      ...bookmark,
      parsedBody: parsed.description || bookmark.body || '',
      parsedUrl: parsed.url || bookmark.url,
      parsedTags: parsed.tags.length > 0 ? parsed.tags : bookmark.labels || []
    };
  });
  
  // 过滤书签
  const filteredBookmarks = processedBookmarks.filter(bookmark => {
    // 搜索过滤
    const matchesSearch = 
      search === '' || 
      bookmark.title?.toLowerCase().includes(search.toLowerCase()) || 
      bookmark.parsedBody?.toLowerCase().includes(search.toLowerCase());
    
    // 标签过滤
    const matchesTags = 
      selectedTags.length === 0 || 
      selectedTags.some(tag => 
        bookmark.labels?.includes(tag) || bookmark.parsedTags?.includes(tag)
      );
    
    return matchesSearch && matchesTags;
  });

  // 切换标签选择
  const toggleTag = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag) 
        : [...prev, tag]
    );
  };

  // 清除所有筛选
  const clearFilters = () => {
    setSearch('');
    setSelectedTags([]);
  };

  return (
    <div className="bookmarks-list">
      <div className="search-container">
        <input 
          type="text" 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索书签..." 
          className="search-input"
        />
        
        {(search || selectedTags.length > 0) && (
          <button onClick={clearFilters} className="clear-button">
            清除筛选
          </button>
        )}
      </div>
      
      {allTags.length > 0 && (
        <div className="tags-container">
          <div className="tags-label">标签筛选:</div>
          <div className="tags-list">
            {allTags.map(tag => (
              <span 
                key={tag} 
                className={`tag ${selectedTags.includes(tag) ? 'selected' : ''}`}
                onClick={() => toggleTag(tag)}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="loading">加载中...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : (
        <>
          <div className="bookmarks-count">
            显示 {filteredBookmarks.length} 个书签 (共 {bookmarks.length} 个)
          </div>
          
          {filteredBookmarks.length === 0 ? (
            <div className="no-results">没有匹配的书签</div>
          ) : (
            <ul className="bookmarks-grid">
              {filteredBookmarks.map(bookmark => (
                <li key={bookmark.id} className="bookmark-item">
                  <a 
                    href={bookmark.parsedUrl || (bookmark.title.startsWith('http') ? bookmark.title : bookmark.url)} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="bookmark-link"
                  >
                    <h3 className="bookmark-title">{bookmark.title.replace(/^\[书签\]\s*/, '')}</h3>
                  </a>
                  
                  {bookmark.parsedBody && (
                    <div className="bookmark-description">{bookmark.parsedBody}</div>
                  )}
                  
                  {(bookmark.parsedTags?.length > 0 || bookmark.labels?.length > 0) && (
                    <div className="bookmark-tags">
                      {[...new Set([...(bookmark.labels || []), ...(bookmark.parsedTags || [])])].map(label => (
                        <span 
                          key={`${bookmark.id}-${label}`} 
                          className="bookmark-tag"
                          onClick={(e) => {
                            e.preventDefault();
                            toggleTag(label);
                          }}
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  <div className="bookmark-meta">
                    <span>添加者: {bookmark.user}</span>
                    <span>日期: {new Date(bookmark.created_at).toLocaleDateString()}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
      
      <style jsx>{`
        .bookmarks-list {
          width: 100%;
        }
        
        .search-container {
          display: flex;
          margin-bottom: 1rem;
          gap: 0.5rem;
        }
        
        .search-input {
          flex: 1;
          padding: 0.5rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 1rem;
        }
        
        .clear-button {
          padding: 0.5rem 1rem;
          background: #f0f0f0;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        
        .clear-button:hover {
          background: #e0e0e0;
        }
        
        .tags-container {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-bottom: 1rem;
          align-items: center;
        }
        
        .tags-label {
          font-weight: bold;
          margin-right: 0.5rem;
        }
        
        .tags-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        
        .tag {
          padding: 0.25rem 0.5rem;
          background: #f0f0f0;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.9rem;
          transition: all 0.2s;
        }
        
        .tag:hover {
          background: #e0e0e0;
        }
        
        .tag.selected {
          background: #007bff;
          color: white;
        }
        
        .bookmarks-count {
          margin-bottom: 1rem;
          font-size: 0.9rem;
          color: #666;
        }
        
        .loading, .error, .no-results {
          padding: 2rem;
          text-align: center;
          color: #666;
        }
        
        .error {
          color: #d9534f;
        }
        
        .bookmarks-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1rem;
          list-style: none;
          padding: 0;
        }
        
        .bookmark-item {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
          padding: 1rem;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        
        .bookmark-item:hover {
          transform: translateY(-3px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.15);
        }
        
        .bookmark-link {
          text-decoration: none;
          color: #007bff;
        }
        
        .bookmark-title {
          margin: 0 0 0.5rem;
          font-size: 1.2rem;
        }
        
        .bookmark-description {
          margin: 0.5rem 0;
          color: #555;
          font-size: 0.95rem;
          line-height: 1.4;
        }
        
        .bookmark-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 0.3rem;
          margin: 0.5rem 0;
        }
        
        .bookmark-tag {
          font-size: 0.8rem;
          padding: 0.15rem 0.4rem;
          background: #f0f0f0;
          border-radius: 3px;
          cursor: pointer;
        }
        
        .bookmark-tag:hover {
          background: #e0e0e0;
        }
        
        .bookmark-meta {
          display: flex;
          justify-content: space-between;
          font-size: 0.8rem;
          color: #888;
          margin-top: 0.5rem;
        }
        
        @media (max-width: 768px) {
          .bookmarks-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default BookmarksList;
