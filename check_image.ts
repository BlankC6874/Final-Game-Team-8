async function checkImageExists(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: "HEAD" }); // 使用 HEAD 请求只获取头信息
    return response.ok; // 检查响应状态是否为 200-299
  } catch (error) {
    console.error(`Error checking image: ${error}`);
    return false;
  }
}

// 示例用法
const imageUrl = "https://blankc6874.github.io/ms-icon-144x144.png";
const exists = await checkImageExists(imageUrl);

if (exists) {
  console.log(`Image exists at ${imageUrl}`);
} else {
  console.log(`Image does not exist at ${imageUrl}`);
}
