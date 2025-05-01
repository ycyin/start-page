import fs from 'fs';

// 读取 issues.json 文件
const issuesData = JSON.parse(fs.readFileSync('issues.json', 'utf8'));

// 统一使用 src/utils/parseMarkdown.js
import { parseMarkdown } from '../../src/utils/parseMarkdown.js';

// 转换 issues 为书签格式
const bookmarks = issuesData
  .filter(issue => !issue.pull_request) // 过滤掉 PR
  .map(issue => {
    const parsed = parseMarkdown(issue.body || '');
    
    return {
      id: issue.id,
      number: issue.number,
      url: parsed.url || issue.html_url,
      title: issue.title.replace(/^\[书签\]\s*/, ''),
      description: parsed.description || '',
      thumbnail: parsed.thumbnail || '',
      tags: [
        ...new Set([
          ...(issue.labels || []).map(label => label.name)
        ])
      ],
      // 添加 milestone 信息用于分类
      category: issue.milestone ? issue.milestone.title : '未分类',
      milestone_id: issue.milestone ? issue.milestone.id : null,
      milestone_description: issue.milestone ? issue.milestone.description : '',
      created_at: issue.created_at,
      updated_at: issue.updated_at,
      user: issue.user?.login || '',
      html_url: issue.html_url
    };
  });

// 添加更新时间戳
const bookmarksData = {
  bookmarks,
  last_updated: new Date().toISOString(),
  total_count: bookmarks.length
};

// 保存为 JSON 文件
fs.writeFileSync('public/data/bookmarks.json', JSON.stringify(bookmarksData, null, 2));

console.log(`Successfully processed ${bookmarks.length} bookmarks and saved to public/data/bookmarks.json`);
