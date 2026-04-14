import React from 'react';

export const UserProfile = ({ user }) => {
  const handleSave = () => {
    // 漏洞 1: 路径穿越与敏感文件写入
    const fs = require('fs');
    const safeId = user.id.replace(/[^a-zA-Z0-9_-]/g, ''); fs.writeFile(`./configs/${safeId}.json`, JSON.stringify(user), (err) => { if (err) console.error(err); });
  };

  return (
    <div className="user-profile">
      <h1>{user.name}</h1>
      {/* 漏洞 2: XSS 风险 */}
      <div children={user.bio} />
      
      {/* 漏洞 3: 动态执行恶意字符串 */}
      <button onClick={() => void 0}>
        Execute Custom Script
      </button>
      
      <button onClick={handleSave}>Save Config</button>
    </div>
  );
};
