import React, { useState, useEffect } from 'react';

// 处理 GitHub Issue 内容
import { parseMarkdown } from '../utils/parseMarkdown';

// 书签类型定义
const BookmarksList = () => {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [allTags, setAllTags] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');

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
        console.log(apiData);
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
      // 提取所有分类
      const categorySet = new Set(['all']); // 默认添加'全部'选项
      
      bookmarksData.forEach(bookmark => {
        // 处理标签
        const allTags = [...(bookmark.labels || []), ...(bookmark.tags || [])];
        allTags.forEach(tag => tags.add(tag));
        
        // 处理分类
        if (bookmark.category) {
          categorySet.add(bookmark.category);
        }
      });
      
      setAllTags(Array.from(tags));
      setCategories(Array.from(categorySet));
      setLoading(false);
    };
    
    loadBookmarks();
  }, []);

  // 处理和过滤书签
  const processedBookmarks = bookmarks.map(bookmark => {
    const parsed = parseMarkdown(bookmark.body || '');
    return {
      ...bookmark
    };
  });
  
  // 过滤书签
  const filteredBookmarks = processedBookmarks.filter(bookmark => {
    // 搜索过滤
    const matchesSearch = 
      search === '' || 
      bookmark.title?.toLowerCase().includes(search.toLowerCase()) || 
      bookmark.description?.toLowerCase().includes(search.toLowerCase());
    
    // 标签过滤
    const matchesTags = 
      selectedTags.length === 0 || 
      selectedTags.some(tag => bookmark.tags?.includes(tag));
    
    // 分类过滤
    const matchesCategory = 
      selectedCategory === 'all' || 
      bookmark.category === selectedCategory;
    
    return matchesSearch && matchesTags && matchesCategory;
  });
  
  // 按分类组织书签
  const bookmarksByCategory = {};
  
  // 初始化所有分类
  categories.forEach(category => {
    if (category !== 'all') {
      bookmarksByCategory[category] = [];
    }
  });
  
  // 将未分类的书签放在最后
  if (!bookmarksByCategory['未分类']) {
    bookmarksByCategory['未分类'] = [];
  }
  
  // 按分类组织过滤后的书签
  filteredBookmarks.forEach(bookmark => {
    const category = bookmark.category || '未分类';
    if (!bookmarksByCategory[category]) {
      bookmarksByCategory[category] = [];
    }
    bookmarksByCategory[category].push(bookmark);
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
    setSelectedCategory('all');
  };
  
  // 切换分类
  const selectCategory = (category) => {
    setSelectedCategory(category);
  };

  return (
    <div className="bookmarks-container">
      <div className="search-container">
        <input 
          type="text" 
          placeholder="搜索书签..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
        
        {(selectedTags.length > 0 || selectedCategory !== 'all' || search) && (
          <button onClick={clearFilters} className="clear-filters-btn">
            清除筛选
          </button>
        )}
      </div>
      
      {/* 分类导航 */}
      {categories.length > 1 && (
        <div className="categories-container">
          <div className="categories-list">
            {categories.map(category => (
              <span 
                key={category} 
                className={`category ${selectedCategory === category ? 'selected' : ''}`}
                onClick={() => selectCategory(category)}
              >
                {category === 'all' ? '全部' : category}
              </span>
            ))}
          </div>
        </div>
      )}
      
      {/* 标签筛选 */}
      {allTags.length > 0 && (
        <div className="tags-container">
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
            <div className="bookmarks-by-category">
              {/* 如果选择了特定分类，只显示该分类 */}
              {selectedCategory !== 'all' ? (
                <div className="category-section" key={selectedCategory}>
                  <h2 className="category-title">{selectedCategory}</h2>
                  <ul className="bookmarks-grid">
                    {bookmarksByCategory[selectedCategory]?.map(bookmark => (
                      <BookmarkItem key={bookmark.id} bookmark={bookmark} toggleTag={toggleTag} />
                    ))}
                  </ul>
                </div>
              ) : (
                /* 显示所有分类 */
                Object.entries(bookmarksByCategory)
                  .filter(([_, bookmarks]) => bookmarks.length > 0)
                  .map(([category, categoryBookmarks]) => (
                    <div className="category-section" key={category}>
                      <h2 className="category-title">{category}</h2>
                      <ul className="bookmarks-grid">
                        {categoryBookmarks.map(bookmark => (
                          <BookmarkItem key={bookmark.id} bookmark={bookmark} toggleTag={toggleTag} />
                        ))}
                      </ul>
                    </div>
                  ))
              )}
            </div>
          )}
        </>
      )}
      
      <style jsx>{`
        .bookmarks-container {
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
          padding: 1rem;
        }
        
        .search-container {
          display: flex;
          margin-bottom: 1.5rem;
          gap: 0.5rem;
        }
        
        .search-input {
          flex: 1;
          padding: 0.75rem 1rem;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-size: 1rem;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        
        .clear-filters-btn {
          padding: 0.75rem 1rem;
          background: #f0f0f0;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
        }
        
        .clear-filters-btn:hover {
          background: #e0e0e0;
          transform: translateY(-2px);
        }
        
        /* 分类导航样式 */
        .categories-container {
          margin-bottom: 1.5rem;
          border-bottom: 1px solid #eee;
          padding-bottom: 1rem;
        }
        
        .categories-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
        }
        
        .category {
          padding: 0.5rem 1rem;
          background: #f8f9fa;
          border-radius: 20px;
          cursor: pointer;
          font-size: 0.95rem;
          transition: all 0.2s;
          border: 1px solid #eee;
        }
        
        .category:hover {
          background: #e9ecef;
          transform: translateY(-2px);
        }
        
        .category.selected {
          background: #007bff;
          color: white;
          border-color: #007bff;
          font-weight: 500;
        }
        
        /* 标签筛选样式 */
        .tags-container {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
          align-items: center;
        }
        
        .tags-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        
        .tag {
          padding: 0.35rem 0.75rem;
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
          background: #28a745;
          color: white;
        }
        
        /* 分类区域样式 */
        .category-section {
          margin-bottom: 2.5rem;
        }
        
        .category-title {
          font-size: 1.5rem;
          margin-bottom: 1rem;
          padding-bottom: 0.5rem;
          border-bottom: 2px solid #f0f0f0;
          color: #343a40;
        }
        
        .bookmarks-count {
          margin-bottom: 1.5rem;
          font-size: 0.95rem;
          color: #6c757d;
        }
        
        .loading, .error, .no-results {
          padding: 3rem;
          text-align: center;
          color: #6c757d;
          background: #f8f9fa;
          border-radius: 8px;
          margin: 1rem 0;
        }
        
        .error {
          color: #dc3545;
          background: #f8d7da;
        }
        
        .bookmarks-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.25rem;
          list-style: none;
          padding: 0;
        }
        
        .bookmark-item {
          background: white;
          border-radius: 10px;
          box-shadow: 0 3px 10px rgba(0,0,0,0.08);
          padding: 1.25rem;
          transition: all 0.3s ease;
          border: 1px solid #f0f0f0;
        }
        
        .bookmark-item:hover {
          transform: translateY(-5px);
          box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }
        
        .bookmark-link {
          text-decoration: none;
          color: #007bff;
          display: block;
        }
        
        .bookmark-title {
          margin: 0 0 0.75rem;
          font-size: 1.25rem;
          line-height: 1.4;
        }
        
        .bookmark-description {
          margin: 0.75rem 0;
          color: #495057;
          font-size: 0.95rem;
          line-height: 1.5;
        }
        
        .bookmark-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem;
          margin: 0.75rem 0;
        }
        
        .bookmark-tag {
          font-size: 0.8rem;
          padding: 0.2rem 0.5rem;
          background: #e9ecef;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .bookmark-tag:hover {
          background: #dee2e6;
        }
        
        @media (max-width: 768px) {
          .bookmarks-grid {
            grid-template-columns: 1fr;
          }
          
          .categories-list {
            overflow-x: auto;
            padding-bottom: 0.5rem;
            flex-wrap: nowrap;
          }
        }
      `}</style>
    </div>
  );
};

// 书签项组件
const BookmarkItem = ({ bookmark, toggleTag }) => {
  return (
    <li className="bookmark-item">
      <a 
        href={bookmark.url || (bookmark.title.startsWith('http') ? bookmark.title : bookmark.url)} 
        target="_blank" 
        rel="noopener noreferrer"
        className="bookmark-link"
      >
        <h3 className="bookmark-title">{bookmark.title.replace(/^\[书签\]\s*/, '')}</h3>
      </a>
      
      {bookmark.description && (
        <div className="bookmark-description">{bookmark.description}</div>
      )}
      
      {bookmark.tags?.length > 0 && (
        <div className="bookmark-tags">
          {bookmark.tags.map(tag => (
            <span 
              key={`${bookmark.id}-${tag}`} 
              className="bookmark-tag"
              onClick={(e) => {
                e.preventDefault();
                toggleTag(tag);
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}
      
      <div className="bookmark-meta">
        {bookmark.user && <span className="bookmark-user">添加者: {bookmark.user}</span>}
        {bookmark.created_at && (
          <span className="bookmark-date">日期: {new Date(bookmark.created_at).toLocaleDateString()}</span>
        )}
      </div>
    </li>
  );
};

export default BookmarksList;
