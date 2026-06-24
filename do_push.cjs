const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

try {
  console.log("🚀 Starting Emergency Push Hook...");
  
  // 1. Copy Image just in case
  const src = 'C:\\Users\\user\\.gemini\\antigravity\\brain\\ea87fc73-a7fc-4c58-a283-5a296b19dfee\\media__1778483370999.jpg';
  const dest = path.join(__dirname, 'public', 'welcome.jpg');
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log("✅ Image synchronized.");
  }

  // 2. Git workflow
  execSync('git add .', { stdio: 'inherit' });
  
  try {
    execSync('git commit -m "fix: resolve doctor AI dashboard endpoint, add robust model fallbacks, and fix auth login single role issue"', { stdio: 'inherit' });
  } catch (e) {
    console.log("ℹ️ Nothing new to commit, skipping commit step.");
  }

  console.log("☁️ Pushing to Remote...");
  execSync('git push origin main', { stdio: 'inherit' });
  
  fs.writeFileSync('push_status.txt', 'SUCCESS - Pushed via Node Trigger at ' + new Date().toISOString());
  console.log("🎉 Git Push COMPLETE!");
} catch (error) {
  fs.writeFileSync('push_status.txt', 'FAILED - ' + error.message + ' at ' + new Date().toISOString());
  console.error("❌ Hook encountered error:", error.message);
}
