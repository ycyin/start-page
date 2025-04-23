// 统一 Markdown 解析方法，供 Node.js 和前端共用
export function parseMarkdown(text) {
  if (!text) return { url: '', description: '', thumbnail: '', tags: [] };
  // 清理模板注释和标记
  let cleanText = text
    .replace(/<!--[\s\S]*?-->/g, '')
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
  if (!description) {
    const lines = cleanText.split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('##') && !line.includes('缩略图') && !line.includes('https://'));
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
  // 提取标签
  let tags = [];
  const tagSection = cleanText.match(/## 标签[\s\S]*?(?=##|$)/);
  if (tagSection) {
    const tagLine = tagSection[0].replace(/## 标签/, '').trim();
    if (tagLine) {
      tags = tagLine.split(',').map(tag => tag.trim()).filter(Boolean);
    }
  }
  if (tags.length === 0) {
    const tagsMatch = cleanText.match(/标签[：:][\s\n]*([^\n]+)/);
    if (tagsMatch) {
      tags = tagsMatch[1].split(',').map(tag => tag.trim()).filter(Boolean);
    }
  }
  return { url, description, thumbnail, tags };
}
