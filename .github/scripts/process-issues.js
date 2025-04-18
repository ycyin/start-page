import fs from 'fs';

// 读取 issues.json 文件
const issuesData = JSON.parse(fs.readFileSync('issues.json', 'utf8'));

// 处理 Markdown 内容，提取关键信息
function parseMarkdown(text) {
  if (!text) return { url: '', description: '', tags: [] };
  
  // 清理模板注释和标记
  let cleanText = text
    // 移除 HTML 注释
    .replace(/<!--[\s\S]*?-->/g, '')
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
        !line.includes('缩略图') && 
        !line.includes('https://')
      );
    
    if (lines.length > 0) {
      description = lines[0];
    }
  }
  
  // 提取缩略图
  let thumbnail = '';
  const thumbnailSection = cleanText.match(/## 缩略图[\s\S]*?(?=##|$)/);
  if (thumbnailSection) {
    const thumbnailMatch = thumbnailSection[0].match(/https?:\/\/[^\s\n]+\.(jpg|jpeg|png|gif|webp)/i);
    if (thumbnailMatch) thumbnail = thumbnailMatch[0];
  }
  
  return { url, description, thumbnail };
}

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
