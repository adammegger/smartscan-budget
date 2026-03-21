#!/usr/bin/env node

import fs from "fs";
import path from "path";

/**
 * Formats a date to Polish format (e.g., "21 marca 2026")
 */
function formatDateToPolish(date) {
  const day = date.getDate();

  const months = [
    "stycznia",
    "lutego",
    "marca",
    "kwietnia",
    "maja",
    "czerwca",
    "lipca",
    "sierpnia",
    "września",
    "października",
    "listopada",
    "grudnia",
  ];

  const month = months[date.getMonth()];
  const year = date.getFullYear();

  return `${day} ${month} ${year}`;
}

/**
 * Updates the LAST_UPDATE constant in a given file
 */
function updateLastUpdateInFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    return false;
  }

  const content = fs.readFileSync(filePath, "utf-8");
  const originalContent = content;

  // Pattern to match: const LAST_UPDATE = "..."
  // This regex looks for the constant declaration and captures the value
  const pattern = /(\bconst\s+LAST_UPDATE\s*=\s*")([^"]*)(")/;

  if (!pattern.test(content)) {
    console.error(`❌ LAST_UPDATE constant not found in: ${filePath}`);
    return false;
  }

  const today = new Date();
  const newDate = formatDateToPolish(today);

  // Replace the date value while preserving the rest of the file
  const updatedContent = content.replace(pattern, `$1${newDate}$3`);

  // Only write if content actually changed
  if (updatedContent !== originalContent) {
    fs.writeFileSync(filePath, updatedContent, "utf-8");
    console.log(`✅ Updated ${filePath}: ${newDate}`);
    return true;
  } else {
    console.log(`ℹ️  No changes needed in ${filePath}`);
    return true;
  }
}

/**
 * Main function
 */
function main() {
  // Target files that contain the LAST_UPDATE constant
  const targetFiles = ["src/pages/Terms.tsx", "src/pages/Privacy.tsx"];

  console.log("🔄 Updating LAST_UPDATE constants...\n");

  let successCount = 0;
  const totalCount = targetFiles.length;

  for (const relativePath of targetFiles) {
    const fullPath = path.resolve(process.cwd(), relativePath);

    if (updateLastUpdateInFile(fullPath)) {
      successCount++;
    }
  }

  console.log(
    `\n📊 Summary: ${successCount}/${totalCount} files processed successfully`,
  );

  if (successCount === totalCount) {
    console.log("🎉 All files updated successfully!");
    process.exit(0);
  } else {
    console.log("⚠️  Some files could not be updated");
    process.exit(1);
  }
}

// Run the script
main();
