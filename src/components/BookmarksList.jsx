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
    <div className="bookmarks-dashboard">
      <div className="toolbar">
        <nav className="category-nav">
          {categories.map(cat => (
            <a
              key={cat}
              href={`#category-${cat}`}
              className={selectedCategory === cat ? 'active' : ''}
              onClick={() => selectCategory(cat)}
            >
              {cat}
            </a>
          ))}
        </nav>
        <div className="filter-search">
          <select
            multiple
            className="tags-select"
            value={selectedTags}
            onChange={e => setSelectedTags(Array.from(e.target.selectedOptions).map(o => o.value))}
          >
            {allTags.map(tag => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
          <input
            type="text"
            className="search-box"
            placeholder="Search bookmarks..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>
      <div className="content">
        {categories.filter(c => c !== 'all').map(cat => {
          const items = bookmarksByCategory[cat] || [];
          return (
            <section id={`category-${cat}`} key={cat} className="category-section">
              <h2>{cat}</h2>
              <div className="cards-grid">
                {items.map(b => (
                  <BookmarkItem key={b.id} bookmark={b} toggleTag={toggleTag} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
      
      <style jsx='true'>{`
        .bookmarks-dashboard {
          width: calc(100%);
          height: calc(100vh);
          display: flex;
          flex-direction: column;
        }
        .toolbar {
          display: flex;
          width: calc(100% - 2rem);
          height: calc(8vh - 2rem);
          padding: 1rem;
          justify-content: space-between;
          align-items: center;
          background-color: #f2f4f7;
        }
        .category-nav {
          display: flex;
          gap: 1rem;
          overflow-x: auto;
        }
        .category-nav a {
          color: #333;
          padding: 0.5rem 1rem;
          border-radius: 5px;
          text-decoration: none;
          white-space: nowrap;
        }
        .category-nav a.active {
          background: #007bff;
          color: #fff;
        }
        .filter-search {
          display: flex;
          gap: 1rem;
          align-items: center;
        }
        .tags-select {
          padding: 0.5rem;
          border: 1px solid #ccc;
          border-radius: 4px;
          min-width: 200px;
          height: auto;
        }
        .search-box {
          padding: 0.5rem 1rem;
          border: 1px solid #ccc;
          border-radius: 4px;
        }
        .content {
          width: calc(100% - 2rem);
          height: calc(92vh - 2rem);
          padding: 1rem;
          overscroll-behavior: contain;
          overflow: auto;
          background-color: #fcfcfd;
          flex: 1 1 0;
          min-height: 0;
          overflow-y: auto;
        }

        .category-section {
          margin-bottom: 2rem;
        }
        .category-section h2 {
          margin-bottom: 1rem;
          font-size: 1.5rem;
        }
        .cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 1.5rem;
        }


        .flex {
    display: flex;
}

.h-8 {
    height: 2rem;
}

.mt-3 {
    margin-top: .75rem;
}

.mx-2 {
    margin-left: .5rem;
    margin-right: .5rem;
}

.line-clamp-1, .line-clamp-2 {
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
}

.line-clamp-2 {
    -webkit-line-clamp: 2;
}

.system-xs-regular {
    font-size: 12px;
    font-weight: 400;
    line-height: 16px;
}

.text-text-secondary {
    color: #354052;
}
        .text-text-tertiary {
    color: #676f83;
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
      >
      <h3 className="text-text-secondary">{bookmark.title.replace(/^\[书签\]\s*/, '')}</h3>
      
      
      {bookmark.description && (
        <div className="line-clamp-2 system-xs-regular text-text-tertiary h-8 mt-3">{bookmark.description}</div>
      )}
      {!bookmark.description && (
        <div className="line-clamp-2 system-xs-regular text-text-tertiary h-8 mt-3">(暂无描述)</div>
      )}
      </a>
      <a
        href={bookmark.html_url ||bookmark.url} 
        target="_blank" 
        rel="noopener noreferrer"
      >
      <div className="flex system-xs-regular text-text-tertiary">
    
        <div className="flex">
          {bookmark.user && <span className="bookmark-user">by {bookmark.user}</span>}
          {bookmark.created_at && (
            <span className="bookmark-date">&nbsp;@{new Date(bookmark.created_at).toLocaleDateString()}</span>
          )}
        </div>

        <div class="system-xs-regular mx-2 text-text-quaternary">·</div>
        

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
                #{tag}&nbsp;
              </span>
            ))}
          </div>
        )}
     </div>
     </a>

      <style jsx='true'>{`
        a {
          text-decoration: none;
        }
        .bookmark-item {
          list-style: none;
          padding: 0.5rem;
          background: #fff;
          border-radius: .75rem;
          box-shadow: 0 1px 4px rgba(0,0,0,0.1);
          transition: box-shadow 0.2s;
        }
        .bookmark-item:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
      `}</style>
    </li>
  );
};

export default BookmarksList;
