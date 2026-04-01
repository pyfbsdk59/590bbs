<template>
  <div class="mt-10 bg-white p-6 md:p-10 rounded-xl shadow-lg transition-colors duration-300 relative overflow-hidden">
    
    <div v-if="showRenderToast" class="fixed bottom-10 right-10 bg-green-600 text-white px-6 py-4 rounded-xl shadow-2xl z-50 animate-bounce-in flex items-center gap-4 border-2 border-white">
      <span class="text-3xl animate-pulse">🛸</span>
      <div>
        <h4 class="font-bold text-lg">伺服器喚醒就緒！</h4>
        <p class="text-sm opacity-90">已過 60 秒，Render/TG 伺服器應該已完成冷啟動。</p>
      </div>
      <button @click="showRenderToast = false" class="ml-4 hover:text-gray-200 font-bold text-xl">✖</button>
    </div>

    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold">後台管理</h2>
      <button v-if="isAuthenticated" @click="logout" class="text-gray-500 hover:text-red-600 text-sm font-bold flex items-center gap-1 transition-colors">
        🚪 登出
      </button>
    </div>

    <div v-if="!isAuthenticated" class="space-y-4">
      <label class="block text-sm font-medium text-gray-700">請輸入今日動態密碼</label>
      <input v-model="inputPassword" type="password" class="border border-gray-300 rounded p-2 w-full focus:outline-none focus:ring-2 focus:border-transparent" :class="themeObj.ring" @keyup.enter="login">
      <p v-if="errorMsg" class="text-red-500 text-sm">{{ errorMsg }}</p>
      <button @click="login" :class="[themeObj.bg, themeObj.hover, 'text-white px-4 py-2 rounded w-full transition duration-300']">登入</button>
    </div>

    <div v-else class="space-y-8 animate-fade-in">
      
      <section class="border-b pb-6">
        <h3 class="text-xl font-semibold mb-4">網站全域設定</h3>
        <div class="space-y-3">
          <div class="flex flex-col md:flex-row gap-3">
            <div class="flex-1">
              <label class="block text-sm text-gray-600 mb-1">網站名稱</label>
              <input v-model="siteTitle" type="text" :class="['border border-gray-300 p-2 w-full rounded focus:outline-none focus:ring-2 focus:border-transparent', themeObj.ring]">
            </div>
            <div class="md:w-1/4">
              <label class="block text-sm text-gray-600 mb-1">網站風格主題</label>
              <select v-model="siteTheme" :class="['border border-gray-300 p-2 w-full rounded focus:outline-none focus:ring-2 focus:border-transparent bg-white', themeObj.ring]">
                <option v-for="(config, key) in themeConfig" :key="key" :value="key">{{ config.label }}</option>
              </select>
            </div>
            <div class="md:w-1/4">
              <label class="block text-sm text-gray-600 mb-1">前台公告排序</label>
              <select v-model="siteSortOrder" :class="['border border-gray-300 p-2 w-full rounded focus:outline-none focus:ring-2 focus:border-transparent bg-white', themeObj.ring]">
                <option value="newest">🕒 最新公告在前</option>
                <option value="oldest">🕰️ 最舊公告在前</option>
              </select>
            </div>
          </div>
          <div>
            <label class="block text-sm text-gray-600 mb-1">跑馬燈內容</label>
            <input v-model="marqueeText" type="text" :class="['border border-gray-300 p-2 w-full rounded focus:outline-none focus:ring-2 focus:border-transparent', themeObj.ring]">
          </div>
          <button @click="updateSettings" :class="[themeObj.bg, themeObj.hover, 'text-white px-6 py-2 rounded font-medium transition duration-300 shadow-sm']">儲存全域設定</button>
        </div>
      </section>

      <section class="border-b pb-6">
        <div class="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-2">
          <h3 class="text-xl font-semibold flex items-center gap-2">
            🎙️ Telegram 錄音證據批次上傳中心
            <span class="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded shadow-sm border border-indigo-200">雲端保全工具</span>
          </h3>
          <button @click="wakeUpTgServer" :disabled="tgWakeUpCountdown > 0" class="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-lg shadow transition-colors flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
            <span v-if="tgWakeUpCountdown > 0">⏳ 伺服器喚醒中... ({{ tgWakeUpCountdown }}s)</span>
            <span v-else>🛸 獨立喚醒 TG 上傳伺服器</span>
          </button>
        </div>
        
        <div class="bg-indigo-50 border border-indigo-200 p-4 md:p-6 rounded-xl shadow-sm relative">
          <div class="mb-4 text-xs text-indigo-700 bg-white p-3 rounded border border-indigo-100 flex items-start gap-2">
            <span class="text-lg">💡</span>
            <p><strong>批次上傳守則：</strong>請先喚醒伺服器。可一次選取多個錄音檔，系統會「自動排隊」上傳，避免記憶體崩潰！</p>
          </div>

          <div class="flex flex-col md:flex-row md:items-start gap-4 mb-4">
            <div class="md:w-1/4">
              <label class="block text-sm font-bold text-indigo-900 mb-1">目標 Topic ID (月份)</label>
              <input v-model="tgTopicId" type="number" placeholder="例: 45" class="border border-indigo-300 p-2 w-full rounded focus:ring-2 focus:ring-indigo-400 bg-white shadow-sm">
            </div>
            <div class="flex-1">
              <label class="block text-sm font-bold text-indigo-900 mb-1">選擇聲音檔 (支援 .wav, .mp3, .3gp 等各式格式，可多選)</label>
              <input type="file" accept="audio/*,video/3gpp,video/3gpp2,audio/3gpp,audio/3gpp2,.wav,.mp3,.m4a,.aac,.ogg,.flac,.amr,.wma,.3gp,.3gpp" multiple ref="tgFileInput" @change="selectFiles" :disabled="isUploading" class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-indigo-200 file:text-indigo-800 hover:file:bg-indigo-300 disabled:opacity-50 cursor-pointer transition-colors shadow-sm bg-white border border-indigo-300 rounded">
            </div>
          </div>

          <div v-if="selectedFiles.length > 0 && !isUploading" class="mb-4 bg-white border border-indigo-100 rounded-lg p-3 max-h-[150px] overflow-y-auto text-sm">
            <p class="font-bold text-indigo-800 mb-2">已選擇 {{ selectedFiles.length }} 個檔案準備上傳：</p>
            <ul class="list-disc pl-5 text-gray-600 space-y-1">
              <li v-for="file in selectedFiles" :key="file.name">
                {{ file.name }} <span class="text-xs text-gray-400">({{(file.size / 1024 / 1024).toFixed(2)}} MB)</span>
              </li>
            </ul>
          </div>

          <div class="mb-4">
             <label class="block text-sm font-bold text-indigo-900 mb-1">錄音檔補充說明 (將套用於本次批次的所有檔案)</label>
             <textarea v-model="tgCustomCaption" placeholder="例如：刑法總則第五章 (可留空)..." class="border border-indigo-300 p-2 w-full rounded focus:ring-2 focus:ring-indigo-400 bg-white shadow-sm rows-2"></textarea>
          </div>

          <div class="flex flex-col md:flex-row items-center gap-4 pt-2 border-t border-indigo-200">
            <button @click="submitBatchUpload" :disabled="selectedFiles.length === 0 || isUploading" class="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-6 rounded-lg shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              <span v-if="isUploading" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              <span>{{ isUploading ? `排隊上傳中 (${currentUploadIndex}/${selectedFiles.length})...` : '🚀 開始批次上傳' }}</span>
            </button>
            <div v-if="uploadStatus" class="flex-1 px-3 py-2 rounded-lg text-sm font-bold" :class="uploadStatus.includes('❌') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'">
              {{ uploadStatus }}
            </div>
          </div>

          <div v-if="tgUploadResults.length > 0" class="mt-6 bg-white border-2 border-green-400 p-4 rounded-lg shadow-sm animate-fade-in">
            <div class="flex justify-between items-center border-b border-green-200 pb-2 mb-3">
              <h4 class="text-green-700 font-bold flex items-center gap-1">✅ 成功保全 {{ tgUploadResults.length }} 筆證據！</h4>
              <button @click="batchSaveToTgTodo" class="bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-1.5 rounded text-xs font-bold transition-colors shadow-sm">
                📝 一鍵全部加入「TG 獨立暫存清單」
              </button>
            </div>
            
            <ul class="space-y-4 max-h-[300px] overflow-y-auto pr-2">
              <li v-for="(res, idx) in tgUploadResults" :key="idx" class="bg-gray-50 p-3 rounded border border-gray-200 text-sm">
                <p><span class="font-bold text-gray-600">檔名：</span>{{ res.filename }}</p>
                <p class="flex items-center gap-2 my-1"><span class="font-bold text-gray-600">連結：</span> <a :href="res.telegram_link" target="_blank" class="text-blue-600 hover:underline truncate">{{ res.telegram_link }}</a></p>
                <p class="flex flex-col"><span class="font-bold text-gray-600">SHA-256 指紋：</span> <code class="bg-white p-1 rounded text-xs text-gray-800 border border-gray-200 mt-1 break-all">{{ res.file_hash }}</code></p>
                <div class="mt-2 text-right">
                  <button @click="copyToClipboard(`錄音檔：${res.filename}\n連結：${res.telegram_link}\n指紋：${res.file_hash}`)" class="text-xs text-gray-500 hover:text-gray-800 font-bold underline">📋 複製單筆資訊</button>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section class="border-b pb-6">
        <div class="flex flex-col md:flex-row justify-between md:items-center mb-4 gap-3">
          <h3 class="text-xl font-semibold flex items-center gap-2 text-indigo-900">📁 TG 獨立暫存清單 <span class="text-xs text-gray-400 font-normal border px-2 py-1 rounded">證據專屬</span></h3>
          <div class="flex gap-2">
            <input type="file" accept=".csv" ref="tgTodoCsvInput" class="hidden" @change="handleTgTodoCsvImport">
            <button @click="() => tgTodoCsvInput.click()" class="text-xs bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 font-bold px-3 py-1.5 rounded shadow-sm">📥 匯入 CSV</button>
            <button @click="exportTgTodosCSV" class="text-xs bg-indigo-600 text-white hover:bg-indigo-700 font-bold px-3 py-1.5 rounded shadow-sm">📤 匯出 CSV</button>
          </div>
        </div>

        <ul class="space-y-2 max-h-[300px] overflow-y-auto pr-2">
          <li v-for="item in tgTodosList" :key="item.id" :class="['flex justify-between items-center p-3 rounded-lg border transition-all duration-200', item.is_completed ? 'bg-gray-100 border-gray-200 opacity-60' : 'bg-indigo-50 border-indigo-200 shadow-sm']">
            <div class="flex items-center gap-3 overflow-hidden">
              <input type="checkbox" :checked="item.is_completed" @change="toggleTgTodo(item)" class="w-5 h-5 rounded cursor-pointer text-indigo-600">
              <div class="flex flex-col">
                <span :class="['font-medium text-gray-800 whitespace-pre-wrap text-sm', {'line-through text-gray-500': item.is_completed}]">{{ item.content }}</span>
                <div class="flex gap-3 text-xs text-gray-500 mt-1">
                  <a v-if="item.url" :href="item.url" target="_blank" class="text-blue-500 hover:underline truncate max-w-[200px]">🔗 Telegram 連結</a>
                  <span class="text-gray-400">建立於: {{ formatDate(item.created_at) }}</span>
                </div>
              </div>
            </div>
            <button @click="deleteTgTodo(item.id)" class="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded transition-colors">✖</button>
          </li>
          <li v-if="tgTodosList.length === 0" class="text-sm text-gray-400 py-4 text-center bg-gray-50 rounded-lg border border-dashed border-gray-300">
            目前 TG 獨立暫存清單中沒有資料。
          </li>
        </ul>
      </section>

      <section class="border-b pb-6">
        <h3 class="text-xl font-semibold mb-4 flex items-center gap-2">
          🔒 後台專屬私密分頁 
          <span class="text-xs bg-gray-800 text-white px-2 py-1 rounded shadow-sm">僅限管理員可見</span>
        </h3>

        <div class="flex flex-wrap items-center gap-2 mb-6 bg-gray-50 p-2 rounded-lg border border-gray-200 min-h-[56px]">
          <div v-for="tab in adminTabs" :key="tab.id" class="relative group flex items-center">
            <div v-if="editingTabId === tab.id" class="flex items-center bg-white border-2 border-blue-400 rounded-full px-2 py-1 shadow-sm">
              <input v-model="editingTabName" @keyup.enter="saveTabName(tab)" class="w-24 text-sm outline-none px-1">
              <button @click="saveTabName(tab)" class="text-green-600 hover:bg-green-100 p-1 rounded-full text-xs">✔</button>
              <button @click="editingTabId = null" class="text-red-500 hover:bg-red-100 p-1 rounded-full text-xs">✖</button>
            </div>
            <button v-else @click="activeAdminTab = tab.id" :class="[activeAdminTab === tab.id ? themeObj.bg + ' text-white shadow-md' : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-100', 'px-4 py-2 rounded-full font-bold text-sm transition-all flex items-center gap-1.5']">
              {{ tab.name }}
              <span @click.stop="startEditTab(tab)" class="text-[10px] opacity-0 group-hover:opacity-100 hover:text-blue-300 transition-opacity ml-1 bg-black/10 px-1.5 py-0.5 rounded">✎</span>
              <span @click.stop="deleteAdminTab(tab.id)" class="text-[10px] opacity-0 group-hover:opacity-100 hover:text-red-400 transition-opacity bg-black/10 px-1.5 py-0.5 rounded">✖</span>
            </button>
          </div>
          
          <div class="flex items-center ml-auto bg-white border border-gray-300 rounded-full overflow-hidden shadow-sm">
            <input v-model="newAdminTabName" type="text" placeholder="+ 新增分頁" class="text-sm px-3 py-2 w-28 md:w-32 focus:outline-none" @keyup.enter="addAdminTab">
            <button @click="addAdminTab" class="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-2 text-sm font-bold transition-colors border-l border-gray-300">新增</button>
          </div>
        </div>

        <div v-if="activeAdminTab" class="bg-blue-50 border border-blue-100 p-4 rounded-xl animate-fade-in relative">
          <div class="flex flex-col md:flex-row md:justify-between md:items-center border-b border-blue-200 pb-3 mb-4 gap-3">
            <h4 class="font-bold text-blue-800 flex items-center gap-2">📝 在「{{ currentTabName }}」新增私密內容</h4>
            <input type="file" accept=".csv" ref="csvFileInput" class="hidden" @change="handleCsvImport">
            <div class="flex gap-2">
              <button @click="triggerImportCsv" class="text-xs bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 font-bold px-3 py-1.5 rounded shadow-sm">📥 匯入 CSV</button>
              <button @click="exportAdminNotesCSV" class="text-xs bg-green-600 text-white hover:bg-green-700 font-bold px-3 py-1.5 rounded shadow-sm">📤 匯出 CSV</button>
            </div>
          </div>

          <div v-if="editingAdminNote" class="bg-white p-4 rounded-lg shadow-sm border border-yellow-300 mb-4 ring-2 ring-yellow-200">
            <h5 class="text-xs font-bold text-yellow-600 mb-2">✏️ 編輯模式中</h5>
            <input v-model="editingAdminNote.title" type="text" placeholder="標題 (必填)" class="border border-gray-300 p-2 w-full rounded text-sm mb-2">
            <textarea v-model="editingAdminNote.description" placeholder="內容說明..." class="border border-gray-300 p-2 w-full rounded text-sm mb-2 rows-2"></textarea>
            <input v-model="editingAdminNote.url" type="url" placeholder="主要網址 (選填)" class="border border-gray-300 p-2 w-full rounded text-sm mb-2">
            <div class="flex gap-4 mb-2">
              <label class="flex items-center gap-2 cursor-pointer"><input v-model="editingAdminNote.is_pinned" type="checkbox" class="w-4 h-4 rounded"><span class="text-xs font-bold text-yellow-600">📌 置頂</span></label>
              <label class="flex items-center gap-2 cursor-pointer"><input v-model="editingAdminNote.is_important" type="checkbox" class="w-4 h-4 rounded"><span class="text-xs font-bold text-red-600">🔥 重要</span></label>
            </div>
            <div class="bg-gray-50 p-2 rounded mb-2 border border-gray-200">
              <div class="flex justify-between items-center mb-1">
                <span class="text-xs text-gray-500 font-bold">額外網址</span>
                <button @click="addLinkToObj(editingAdminNote)" class="text-[10px] bg-gray-200 px-2 py-0.5 rounded">+ 新增</button>
              </div>
              <div v-for="(link, index) in editingAdminNote.links" :key="index" class="flex gap-1 mb-1 items-center">
                <input v-model="link.name" type="text" placeholder="名稱" class="border border-gray-300 p-1 text-xs rounded w-1/3">
                <input v-model="link.url" type="url" placeholder="網址" class="border border-gray-300 p-1 text-xs rounded flex-1">
                <button @click="removeLinkFromObj(editingAdminNote, index)" class="text-red-500 text-xs px-1">✖</button>
              </div>
            </div>
            <div class="flex justify-end gap-2">
              <button @click="cancelEditAdminNote" class="text-xs px-3 py-1.5 bg-gray-200 rounded hover:bg-gray-300 font-bold">取消</button>
              <button @click="saveAdminNote" class="text-xs px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 font-bold">儲存變更</button>
            </div>
          </div>

          <div v-else class="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
            <div class="flex gap-2 mb-2"><input v-model="newAdminNote.title" type="text" placeholder="標題 (必填)" class="border border-gray-300 p-2 w-full rounded text-sm focus:ring-1 focus:ring-blue-300"></div>
            <textarea v-model="newAdminNote.description" placeholder="內容說明或貼上暫存清單的資訊..." class="border border-gray-300 p-2 w-full rounded text-sm mb-2 focus:ring-1 focus:ring-blue-300 rows-3"></textarea>
            <input v-model="newAdminNote.url" type="url" placeholder="Telegram 主要網址 (選填)" class="border border-gray-300 p-2 w-full rounded text-sm mb-3 focus:ring-1 focus:ring-blue-300 bg-gray-50">
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div class="flex gap-4">
                <label class="flex items-center gap-2 cursor-pointer"><input v-model="newAdminNote.is_pinned" type="checkbox" class="w-4 h-4 text-blue-600 rounded"><span class="text-xs font-bold text-yellow-600">📌 置頂</span></label>
                <label class="flex items-center gap-2 cursor-pointer"><input v-model="newAdminNote.is_important" type="checkbox" class="w-4 h-4 text-red-600 rounded"><span class="text-xs font-bold text-red-600">🔥 重要</span></label>
              </div>
              <button @click="addAdminNote" class="bg-gray-800 text-white px-5 py-2 rounded text-sm font-bold shadow hover:bg-gray-900 transition">💾 新增私密紀錄</button>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div v-for="item in filteredAdminNotes" :key="item.id" :class="['relative p-5 rounded-xl shadow-sm hover:shadow-md transition duration-300 flex flex-col', item.is_important ? 'bg-red-50 border border-red-300' : 'bg-white border border-gray-200']">
              <div class="absolute -top-3 -right-2 flex gap-1">
                <span v-if="item.is_pinned" class="bg-yellow-400 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow">📌 置頂</span>
                <span v-if="item.is_important" class="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow">🔥 重要</span>
              </div>
              <div class="text-[10px] text-gray-400 mb-2 flex justify-between items-center font-mono">
                <span>🕒 {{ formatDate(item.created_at) }}</span>
                <div class="flex gap-2">
                  <button @click="startEditAdminNote(item)" class="text-blue-500 hover:text-blue-700 underline font-bold">編輯</button>
                  <button @click="deleteAdminNote(item.id)" class="text-red-500 hover:text-red-700 underline font-bold">刪除</button>
                </div>
              </div>
              <h5 :class="['text-lg font-bold mb-1', item.is_important ? 'text-red-700' : 'text-gray-900']">{{ item.title }}</h5>
              <p class="text-sm text-gray-600 whitespace-pre-wrap flex-1">{{ item.description }}</p>
              <div class="mt-3 flex flex-wrap gap-2">
                <a v-if="item.url" :href="item.url" target="_blank" :class="[themeObj.bg, 'text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm hover:opacity-80 transition-opacity']">主要網址 🚀</a>
                <a v-for="(link, index) in item.links || []" :key="index" :href="link.url" target="_blank" class="bg-gray-100 border border-gray-300 text-gray-700 hover:bg-gray-200 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-colors">{{ link.name || '參考網址' }}</a>
              </div>
            </div>
            <div v-if="filteredAdminNotes.length === 0" class="col-span-1 md:col-span-2 text-center py-10 text-gray-400 border-2 border-dashed border-gray-300 rounded-xl bg-white opacity-60">這個分頁目前沒有任何私密紀錄。</div>
          </div>
        </div>
        <div v-else class="text-center py-6 text-gray-400 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50">👆 請在上方選擇或新增一個分頁。</div>
      </section>

      <section class="border-b pb-6">
        <div class="flex flex-col md:flex-row justify-between md:items-center mb-4 gap-3">
          <h3 class="text-xl font-semibold flex items-center gap-2">📝 管理員暫存清單 <span class="text-xs text-gray-400 font-normal border px-2 py-1 rounded">一般事務</span></h3>
          <div class="flex gap-2">
            <input type="file" accept=".csv" ref="todoCsvInput" class="hidden" @change="handleTodoCsvImport">
            <button @click="() => todoCsvInput.click()" class="text-xs bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 font-bold px-3 py-1.5 rounded shadow-sm">📥 匯入 CSV</button>
            <button @click="exportTodosCSV" class="text-xs bg-gray-800 text-white hover:bg-gray-900 font-bold px-3 py-1.5 rounded shadow-sm">📤 匯出 CSV</button>
          </div>
        </div>
        <div class="flex flex-col md:flex-row gap-2 mb-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
          <input v-model="newTodo.content" type="text" placeholder="輸入備忘、草稿或代辦事項..." :class="['border border-gray-300 p-2 flex-[2] rounded text-sm focus:outline-none focus:ring-2 focus:border-transparent', themeObj.ring]">
          <input v-model="newTodo.url" type="url" placeholder="附加網址 (選填)" :class="['border border-gray-300 p-2 flex-1 rounded text-sm focus:outline-none focus:ring-2 focus:border-transparent', themeObj.ring]">
          <input v-model="newTodo.due_date" type="datetime-local" title="指定日期時間 (選填)" :class="['border border-gray-300 p-2 rounded text-sm focus:outline-none focus:ring-2 focus:border-transparent text-gray-600', themeObj.ring]">
          <button @click="addTodo" class="bg-gray-800 text-white px-5 py-2 rounded hover:bg-gray-900 text-sm font-medium whitespace-nowrap transition-colors">新增紀錄</button>
        </div>
        <ul class="space-y-2 max-h-[300px] overflow-y-auto pr-2">
          <li v-for="todo in todosList" :key="todo.id" :class="['flex justify-between items-center p-3 rounded-lg border transition-all duration-200', todo.is_completed ? 'bg-gray-100 border-gray-200 opacity-60' : 'bg-white border-gray-300 shadow-sm']">
            <div class="flex items-center gap-3 overflow-hidden">
              <input type="checkbox" :checked="todo.is_completed" @change="toggleTodo(todo)" :class="['w-5 h-5 rounded cursor-pointer', themeObj.text]">
              <div class="flex flex-col">
                <span :class="['font-medium text-gray-800 truncate', {'line-through text-gray-500': todo.is_completed}]">{{ todo.content }}</span>
                <div class="flex gap-3 text-xs text-gray-500 mt-1">
                  <span v-if="todo.due_date" class="bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded flex items-center gap-1">⏰ {{ formatTodoDate(todo.due_date) }}</span>
                  <a v-if="todo.url" :href="todo.url" target="_blank" class="text-blue-500 hover:underline truncate max-w-[150px]">🔗 相關連結</a>
                  <span class="text-gray-400">建立於: {{ formatDate(todo.created_at) }}</span>
                </div>
              </div>
            </div>
            <button @click="deleteTodo(todo.id)" class="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded transition-colors">✖</button>
          </li>
          <li v-if="todosList.length === 0" class="text-sm text-gray-400 py-4 text-center bg-gray-50 rounded-lg border border-dashed border-gray-300">目前沒有任何待辦或暫存訊息。</li>
        </ul>
      </section>

      <section class="border-b pb-6">
        <h3 class="text-xl font-semibold mb-4">📢 編輯前台教學內容</h3>
        <div class="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6">
          <h4 class="font-bold text-gray-700 mb-3">✨ 發布新公告到前台</h4>
          <div class="space-y-4">
            <div class="flex flex-col md:flex-row gap-3">
              <div class="md:w-1/3">
                <label class="block text-sm text-gray-600 mb-1">所屬科目</label>
                <select v-model="newPost.category" :class="['border border-gray-300 p-2 w-full rounded bg-white focus:ring-2 focus:border-transparent focus:outline-none', themeObj.ring]">
                  <option value="資訊科技">💻 資訊科技</option>
                  <option value="英語">🔤 英語</option>
                </select>
              </div>
              <div class="flex-1">
                <label class="block text-sm text-gray-600 mb-1">教學標題 (必填)</label>
                <input v-model="newPost.title" type="text" placeholder="輸入標題..." :class="['border border-gray-300 p-2 w-full rounded focus:ring-2 focus:border-transparent focus:outline-none', themeObj.ring]">
              </div>
            </div>
            
            <div class="flex gap-4">
              <label class="flex items-center gap-2 cursor-pointer"><input v-model="newPost.is_pinned" type="checkbox" class="w-4 h-4 text-blue-600 rounded"><span class="text-sm font-bold text-yellow-600">📌 置頂此公告</span></label>
              <label class="flex items-center gap-2 cursor-pointer"><input v-model="newPost.is_important" type="checkbox" class="w-4 h-4 text-red-600 rounded"><span class="text-sm font-bold text-red-600">🔥 標記為重要</span></label>
            </div>

            <div>
              <label class="block text-sm text-gray-600 mb-1">內容說明</label>
              <textarea v-model="newPost.description" placeholder="簡單描述一下..." :class="['border border-gray-300 p-2 w-full rounded focus:ring-2 focus:border-transparent focus:outline-none rows-2', themeObj.ring]"></textarea>
            </div>
            
            <div>
              <label class="block text-sm text-gray-600 mb-1">主要網址 (必填)</label>
              <input v-model="newPost.url" type="url" placeholder="https://..." :class="['border border-gray-300 p-2 w-full rounded focus:ring-2 focus:border-transparent focus:outline-none', themeObj.ring]">
            </div>

            <div class="bg-white p-3 rounded border border-gray-200">
              <div class="flex justify-between items-center mb-2">
                <label class="text-sm text-gray-600 font-bold">額外相關網址 (選填)</label>
                <button @click="addLinkToObj(newPost)" class="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded hover:bg-blue-200">+ 新增網址</button>
              </div>
              <div v-for="(link, index) in newPost.links" :key="index" class="flex gap-2 mb-2 items-center">
                <input v-model="link.name" type="text" placeholder="按鈕名稱" class="border border-gray-300 p-1.5 text-sm rounded w-1/3">
                <input v-model="link.url" type="url" placeholder="https://..." class="border border-gray-300 p-1.5 text-sm rounded flex-1">
                <button @click="removeLinkFromObj(newPost, index)" class="text-red-500 hover:text-red-700 font-bold px-2">✖</button>
              </div>
            </div>

            <button @click="addPost" :class="[themeObj.bg, themeObj.hover, 'text-white px-6 py-2 rounded font-medium transition duration-300 shadow-sm w-full md:w-auto']">發布內容</button>
          </div>
        </div>

        <div v-if="editingPost" class="bg-yellow-50 p-4 rounded-xl border border-yellow-200 shadow-sm space-y-4 mb-4 animate-fade-in relative">
          <div class="flex justify-between items-center border-b border-yellow-200 pb-2">
            <h4 class="font-bold text-gray-800">✏️ 編輯前台教學內容</h4>
            <button @click="cancelEdit" class="text-gray-500 hover:text-red-500 text-sm font-bold">✖ 取消</button>
          </div>
          
          <div class="flex flex-col md:flex-row gap-3">
            <div class="md:w-1/3">
              <label class="block text-xs text-gray-500 mb-1">分類</label>
              <select v-model="editingPost.category" class="border border-gray-300 p-2 w-full rounded bg-white text-sm">
                <option value="資訊科技">💻 資訊科技</option>
                <option value="英語">🔤 英語</option>
              </select>
            </div>
            <div class="flex-1">
              <label class="block text-xs text-gray-500 mb-1">標題</label>
              <input v-model="editingPost.title" type="text" class="border border-gray-300 p-2 w-full rounded text-sm">
            </div>
          </div>

          <div class="flex gap-4">
            <label class="flex items-center gap-2 cursor-pointer">
              <input v-model="editingPost.is_pinned" type="checkbox" class="w-4 h-4 text-blue-600 rounded">
              <span class="text-sm font-bold text-yellow-600">📌 置頂</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input v-model="editingPost.is_important" type="checkbox" class="w-4 h-4 text-red-600 rounded">
              <span class="text-sm font-bold text-red-600">🔥 重要</span>
            </label>
          </div>

          <div>
            <label class="block text-xs text-gray-500 mb-1">說明</label>
            <textarea v-model="editingPost.description" class="border border-gray-300 p-2 w-full rounded text-sm rows-2"></textarea>
          </div>
          <div>
            <label class="block text-xs text-gray-500 mb-1">主要網址</label>
            <input v-model="editingPost.url" type="url" class="border border-gray-300 p-2 w-full rounded text-sm">
          </div>

          <div class="bg-white p-3 rounded border border-gray-200">
            <div class="flex justify-between items-center mb-2">
              <label class="text-xs text-gray-500 font-bold">額外相關網址</label>
              <button @click="addLinkToObj(editingPost)" class="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded hover:bg-blue-200">+ 新增</button>
            </div>
            <div v-for="(link, index) in editingPost.links" :key="index" class="flex gap-2 mb-2 items-center">
              <input v-model="link.name" type="text" placeholder="名稱" class="border border-gray-300 p-1.5 text-sm rounded w-1/3">
              <input v-model="link.url" type="url" placeholder="https://..." class="border border-gray-300 p-1.5 text-sm rounded flex-1">
              <button @click="removeLinkFromObj(editingPost, index)" class="text-red-500 hover:text-red-700 font-bold px-2">✖</button>
            </div>
          </div>

          <div class="flex justify-end gap-2 mt-3">
            <button @click="cancelEdit" class="px-4 py-2 rounded text-sm text-gray-700 bg-gray-200 hover:bg-gray-300 transition-colors font-medium">取消</button>
            <button @click="saveEdit" :class="[themeObj.bg, themeObj.hover, 'text-white px-4 py-2 rounded text-sm transition-colors font-medium']">儲存變更</button>
          </div>
        </div>

        <ul v-else class="space-y-3 max-h-[500px] overflow-y-auto pr-2">
          <li v-for="item in adminBulletins" :key="item.id" class="flex flex-col md:flex-row justify-between md:items-center bg-white p-3 rounded-lg border shadow-sm hover:shadow-md transition-shadow" :class="item.is_important ? 'border-red-300 bg-red-50' : 'border-gray-200'">
            <div class="flex flex-col mb-2 md:mb-0">
              <div class="flex items-center gap-2 flex-wrap">
                <span v-if="item.is_pinned" class="bg-yellow-400 text-white text-[10px] px-1.5 py-0.5 rounded">📌</span>
                <span v-if="item.is_important" class="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded">🔥</span>
                <span :class="item.category === '資訊科技' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'" class="text-xs font-bold px-2 py-0.5 rounded whitespace-nowrap">{{ item.category }}</span>
                <span class="font-bold text-gray-800 text-base" :class="{'text-red-700': item.is_important}">{{ item.title }}</span>
              </div>
              <div class="flex flex-col text-xs text-gray-500 mt-1 gap-1">
                <span>🕒 {{ formatDate(item.created_at) }}</span>
                <span class="truncate max-w-xs md:max-w-md">🔗 {{ item.url }}</span>
              </div>
            </div>
            <div class="flex gap-2 self-end md:self-auto mt-2 md:mt-0">
              <button @click="startEdit(item)" :class="['text-sm px-3 py-1 rounded border transition-colors font-medium', themeObj.text, themeObj.bg.replace('bg-', 'border-'), themeObj.bg.replace('bg-', 'hover:bg-').replace('600', '50')]">編輯</button>
              <button @click="deletePost(item.id)" class="text-red-500 hover:bg-red-500 hover:text-white text-sm px-3 py-1 rounded border border-transparent hover:border-red-600 transition-colors font-medium">刪除</button>
            </div>
          </li>
        </ul>
      </section>

      <section class="border-b pb-6">
        <div class="flex flex-col md:flex-row justify-between md:items-center mb-4 gap-3">
          <h3 class="text-xl font-semibold">外部網站保活與捷徑設定</h3>
          <div class="flex gap-2">
            <button @click="pingUrlsByPlatform('Vercel')" :disabled="isPinging" class="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-900 disabled:opacity-50 transition duration-300 flex items-center shadow-sm text-sm">
              <span v-if="isPingingPlatform === 'Vercel'" class="animate-pulse">⏳ Vercel 喚醒中...</span>
              <span v-else>🚀 喚醒所有 Vercel</span>
            </button>
            <button @click="pingUrlsByPlatform('Render')" :disabled="isPinging" class="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50 transition duration-300 flex items-center shadow-sm text-sm">
              <span v-if="isPingingPlatform === 'Render'" class="animate-pulse">⏳ Render 喚醒中...</span>
              <span v-else>🛸 喚醒所有 Render</span>
            </button>
          </div>
        </div>
        
        <p v-if="pingResult" :class="[themeObj.text, 'text-sm mb-3 font-bold']">{{ pingResult }}</p>

        <div class="flex flex-col md:flex-row gap-2 mb-6 bg-gray-50 p-3 rounded-lg border border-gray-200">
          <select v-model="newKeepAlive.platform" :class="['border border-gray-300 p-2 rounded text-sm bg-white focus:outline-none focus:ring-2 focus:border-transparent', themeObj.ring]"><option value="Vercel">Vercel</option><option value="Render">Render</option></select>
          <input v-model="newKeepAlive.name" type="text" placeholder="名稱" :class="['border border-gray-300 p-2 w-full md:w-32 rounded text-sm focus:outline-none focus:ring-2 focus:border-transparent', themeObj.ring]">
          <input v-model="newKeepAlive.url" type="url" placeholder="喚醒 API" :class="['border border-gray-300 p-2 flex-1 rounded text-sm focus:outline-none focus:ring-2 focus:border-transparent', themeObj.ring]">
          <input v-model="newKeepAlive.home_url" type="url" placeholder="首頁網址" :class="['border border-gray-300 p-2 flex-1 rounded text-sm focus:outline-none focus:ring-2 focus:border-transparent', themeObj.ring]">
          <button @click="addKeepAliveUrl" :class="[themeObj.bg, themeObj.hover, 'text-white px-5 py-2 rounded text-sm font-medium shadow-sm']">新增</button>
        </div>

        <div class="space-y-6">
          <div>
            <h4 class="text-sm font-bold text-gray-500 mb-2">▲ Vercel 專案</h4>
            <ul class="space-y-2"><li v-for="item in vercelUrls" :key="item.id" class="flex justify-between items-center bg-white p-3 rounded border-l-4 border-l-gray-800"><span class="font-bold text-gray-800">{{ item.name }}</span><button @click="deleteKeepAliveUrl(item.id)" class="text-red-500 text-sm">刪除</button></li></ul>
          </div>
          <div>
            <h4 class="text-sm font-bold text-purple-500 mb-2">◆ Render 專案</h4>
            <ul class="space-y-2"><li v-for="item in renderUrls" :key="item.id" class="flex justify-between items-center bg-white p-3 rounded border-l-4 border-l-purple-500"><span class="font-bold text-gray-800">{{ item.name }}</span><button @click="deleteKeepAliveUrl(item.id)" class="text-red-500 text-sm">刪除</button></li></ul>
          </div>
        </div>
      </section>

    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { getTodayPassword } from '@/utils/auth'
import { themeConfig } from '@/utils/theme'

const dayjs = useDayjs()
const supabase = useSupabaseClient()

const currentTheme = useState('currentTheme')
const themeObj = computed(() => themeConfig[currentTheme.value] || themeConfig.purple)

const isAuthenticated = ref(false)
const inputPassword = ref('')
const errorMsg = ref('')

const siteTitle = ref('')
const marqueeText = ref('')
const siteTheme = ref('purple')
const siteSortOrder = ref('newest') 

// ====== 共用 CSV 解析函數 ======
const parseCSVString = (str) => {
  const arr = []; let quote = false; let row = 0, col = 0
  for (let c = 0; c < str.length; c++) {
    let cc = str[c], nc = str[c+1]
    arr[row] = arr[row] || []; arr[row][col] = arr[row][col] || ''
    if (cc == '"' && quote && nc == '"') { arr[row][col] += cc; ++c; continue; }  
    if (cc == '"') { quote = !quote; continue; }
    if (cc == ',' && !quote) { ++col; continue; }
    if (cc == '\n' && !quote) { ++row; col = 0; continue; }
    if (cc == '\r' && !quote) continue
    arr[row][col] += cc
  }
  return arr.filter(r => r.length > 1 || r[0] !== '') 
}

// ====== 🌟 獨立的 Telegram 上傳狀態變數 (支援多檔案) ======
const tgTopicId = ref('')
const tgCustomCaption = ref('')
const isUploading = ref(false)
const uploadStatus = ref('')
const selectedFiles = ref([]) 
const currentUploadIndex = ref(0) 
const tgUploadResults = ref([]) 
const tgFileInput = ref(null) 

const selectFiles = (event) => {
  selectedFiles.value = Array.from(event.target.files)
  if (selectedFiles.value.length > 0) {
    uploadStatus.value = `📦 已選擇 ${selectedFiles.value.length} 個檔案。請確認資料後點擊「開始批次上傳」。`
    tgUploadResults.value = [] 
  } else { uploadStatus.value = '' }
}

const submitBatchUpload = async () => {
  if (selectedFiles.value.length === 0) return
  if (!tgTopicId.value) return alert('請輸入 Topic ID')

  isUploading.value = true
  tgUploadResults.value = []
  let hasError = false

  for (let i = 0; i < selectedFiles.value.length; i++) {
    const file = selectedFiles.value[i]
    currentUploadIndex.value = i + 1
    uploadStatus.value = `⏳ 正在上傳第 ${i + 1} / ${selectedFiles.value.length} 個檔案: ${file.name}...`

    const formData = new FormData()
    formData.append('file', file)
    formData.append('topic_id', tgTopicId.value)
    
    const uploadTime = dayjs().format('YYYY/MM/DD HH:mm')
    let captionText = `📂 錄音檔：${file.name}\n🕒 上傳時間：${uploadTime}`
    if (tgCustomCaption.value) captionText += `\n📝 說明：${tgCustomCaption.value}`
    formData.append('caption', captionText)

    try {
      const response = await fetch('https://tg-uploader-api.onrender.com/upload/', { method: 'POST', body: formData })
      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) throw new Error(`伺服器未喚醒或發生錯誤。`)
      const data = await response.json()
      if (data.success) tgUploadResults.value.push(data)
      else throw new Error(data.detail || data.error)
    } catch (error) {
      console.error(`檔案 ${file.name} 失敗:`, error)
      hasError = true
    }
  }

  isUploading.value = false
  currentUploadIndex.value = 0
  if (tgFileInput.value) tgFileInput.value.value = ''
  selectedFiles.value = [] 
  tgCustomCaption.value = '' 

  if (hasError && tgUploadResults.value.length === 0) uploadStatus.value = `❌ 上傳失敗，請檢查伺服器狀態。`
  else if (hasError) uploadStatus.value = `⚠️ 部分檔案失敗。成功 ${tgUploadResults.value.length} 個檔案。`
  else uploadStatus.value = `✅ 批次上傳完美完成！共成功保全 ${tgUploadResults.value.length} 個檔案。`
}

const copyToClipboard = async (text) => {
  try { await navigator.clipboard.writeText(text); alert('✅ 已複製！') } 
  catch (err) { alert('❌ 複製失敗') }
}

const tgWakeUpCountdown = ref(0)
const wakeUpTgServer = async () => {
  tgWakeUpCountdown.value = 60
  try {
    const urlObj = new URL('https://tg-uploader-api.onrender.com/')
    urlObj.searchParams.append('_ping_ts', Date.now().toString())
    await fetch(urlObj.toString(), { method: 'GET', mode: 'no-cors', cache: 'no-store' })
  } catch (e) {}

  const timer = setInterval(() => {
    tgWakeUpCountdown.value--
    if (tgWakeUpCountdown.value <= 0) {
      clearInterval(timer)
      showRenderToast.value = true 
      setTimeout(() => { showRenderToast.value = false }, 10000)
    }
  }, 1000)
}

// ====== 🌟 TG 獨立暫存清單 (tg_todos) 邏輯 ======
const tgTodosList = ref([])
const loadTgTodos = async () => {
  const { data } = await supabase.from('tg_todos').select('*').order('created_at', { ascending: false })
  if (data) tgTodosList.value = data
}

const batchSaveToTgTodo = async () => {
  if (tgUploadResults.value.length === 0) return
  for (const res of tgUploadResults.value) {
    const content = `[TG證據] ${res.filename}\n指紋: ${res.file_hash}`
    await supabase.from('tg_todos').insert([{ content: content, url: res.telegram_link, is_completed: false }])
  }
  loadTgTodos()
  alert(`✅ 已將 ${tgUploadResults.value.length} 筆記錄加入「TG 獨立暫存清單」！`)
}

const toggleTgTodo = async (todo) => {
  await supabase.from('tg_todos').update({ is_completed: !todo.is_completed }).eq('id', todo.id)
  loadTgTodos()
}

const deleteTgTodo = async (id) => {
  if (!confirm('確定刪除這個項目嗎？')) return
  await supabase.from('tg_todos').delete().eq('id', id)
  loadTgTodos()
}

// TG 獨立暫存清單 CSV 匯出匯入
const exportTgTodosCSV = () => {
  if (!tgTodosList.value.length) return alert('沒有資料可以匯出！')
  const headers = ['內容(content)', '網址(url)', '是否完成(is_completed)']
  let csvContent = headers.join(',') + '\n'
  tgTodosList.value.forEach(t => {
    const content = `"${(t.content || '').replace(/"/g, '""')}"`
    const url = `"${(t.url || '').replace(/"/g, '""')}"`
    const isCompleted = t.is_completed ? 'TRUE' : 'FALSE'
    csvContent += [content, url, isCompleted].join(',') + '\n'
  })
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `TG獨立暫存清單_${dayjs().format('YYYYMMDD')}.csv`
  link.click()
}

const tgTodoCsvInput = ref(null)
const handleTgTodoCsvImport = async (event) => {
  const file = event.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = async (e) => {
    const rows = parseCSVString(e.target.result)
    if (rows.length < 2) return alert('CSV 格式錯誤！')
    const insertData = []
    for (let i = 1; i < rows.length; i++) {
      if (rows[i].length < 3) continue
      insertData.push({
        content: rows[i][0],
        url: rows[i][1],
        is_completed: rows[i][2].trim().toUpperCase() === 'TRUE'
      })
    }
    if (insertData.length > 0) {
      await supabase.from('tg_todos').insert(insertData)
      alert(`成功匯入 ${insertData.length} 筆 TG 紀錄！`)
      loadTgTodos()
    }
    tgTodoCsvInput.value.value = ''
  }
  reader.readAsText(file)
}

// ====== 一般 To-Do 暫存清單邏輯 ======
const todosList = ref([])
const newTodo = ref({ content: '', url: '', due_date: '' })

const loadTodos = async () => {
  const { data } = await supabase.from('todos').select('*').order('created_at', { ascending: false })
  if (data) todosList.value = data
}

const addTodo = async () => {
  if (!newTodo.value.content) return alert('內容不能為空！')
  const payload = { ...newTodo.value }
  if (!payload.due_date) payload.due_date = null
  await supabase.from('todos').insert([payload])
  newTodo.value = { content: '', url: '', due_date: '' }
  loadTodos()
}

const toggleTodo = async (todo) => {
  await supabase.from('todos').update({ is_completed: !todo.is_completed }).eq('id', todo.id)
  loadTodos()
}

const deleteTodo = async (id) => {
  if (!confirm('確定刪除這個項目嗎？')) return
  await supabase.from('todos').delete().eq('id', id)
  loadTodos()
}

const formatTodoDate = (dateString) => dayjs(dateString).format('MM/DD HH:mm')

// 一般 To-Do CSV 匯出匯入
const exportTodosCSV = () => {
  if (!todosList.value.length) return alert('沒有資料可以匯出！')
  const headers = ['內容(content)', '網址(url)', '期限(due_date)', '是否完成(is_completed)']
  let csvContent = headers.join(',') + '\n'
  todosList.value.forEach(t => {
    const content = `"${(t.content || '').replace(/"/g, '""')}"`
    const url = `"${(t.url || '').replace(/"/g, '""')}"`
    const dueDate = t.due_date ? `"${t.due_date}"` : '""'
    const isCompleted = t.is_completed ? 'TRUE' : 'FALSE'
    csvContent += [content, url, dueDate, isCompleted].join(',') + '\n'
  })
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `一般暫存清單_${dayjs().format('YYYYMMDD')}.csv`
  link.click()
}

const todoCsvInput = ref(null)
const handleTodoCsvImport = async (event) => {
  const file = event.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = async (e) => {
    const rows = parseCSVString(e.target.result)
    if (rows.length < 2) return alert('CSV 格式錯誤！')
    const insertData = []
    for (let i = 1; i < rows.length; i++) {
      if (rows[i].length < 4) continue
      let dDate = rows[i][2].replace(/"/g, '').trim()
      insertData.push({
        content: rows[i][0],
        url: rows[i][1],
        due_date: dDate ? dDate : null,
        is_completed: rows[i][3].trim().toUpperCase() === 'TRUE'
      })
    }
    if (insertData.length > 0) {
      await supabase.from('todos').insert(insertData)
      alert(`成功匯入 ${insertData.length} 筆紀錄！`)
      loadTodos()
    }
    todoCsvInput.value.value = ''
  }
  reader.readAsText(file)
}

// ====== 其餘邏輯 (私密分頁、前台公告、保活等) 保持不變 ======
const adminTabs = ref([]); const activeAdminTab = ref(null); const newAdminTabName = ref(''); const editingTabId = ref(null); const editingTabName = ref('')
const currentTabName = computed(() => adminTabs.value.find(t => t.id === activeAdminTab.value)?.name || '')
const adminNotes = ref([]); const newAdminNote = ref({ title: '', description: '', url: '', is_important: false, is_pinned: false, links: [] }); const editingAdminNote = ref(null)
const filteredAdminNotes = computed(() => adminNotes.value.filter(n => n.tab_id === activeAdminTab.value).sort((a, b) => a.is_pinned !== b.is_pinned ? (a.is_pinned ? -1 : 1) : new Date(b.created_at) - new Date(a.created_at)))

const getEmptyPost = () => ({ title: '', description: '', url: '', category: '資訊科技', is_important: false, is_pinned: false, links: [] })
const newPost = ref(getEmptyPost()); const adminBulletins = ref([]); const editingPost = ref(null)  
const showRenderToast = ref(false); const visitorLogs = ref([]); const keepAliveUrls = ref([]); const newKeepAlive = ref({ name: '', url: '', home_url: '', platform: 'Vercel' }); const isPinging = ref(false); const isPingingPlatform = ref(''); const pingResult = ref('')
const vercelUrls = computed(() => keepAliveUrls.value.filter(item => item.platform === 'Vercel' || !item.platform)); const renderUrls = computed(() => keepAliveUrls.value.filter(item => item.platform === 'Render'))

const login = () => {
  const correctPassword = getTodayPassword()
  if (inputPassword.value === correctPassword) {
    isAuthenticated.value = true; errorMsg.value = ''
    loadSettings(); loadAdminTabs(); loadAdminNotes(); loadBulletins(); loadTodos(); loadTgTodos(); loadKeepAliveUrls(); loadVisitorLogs()
  } else { errorMsg.value = '密碼錯誤！' }
}
const logout = () => { isAuthenticated.value = false; inputPassword.value = ''; navigateTo('/') }

const loadSettings = async () => {
  const { data } = await supabase.from('site_settings').select('*').eq('id', 1).single()
  if (data) { siteTitle.value = data.title; marqueeText.value = data.marquee_text; siteTheme.value = data.theme || 'purple'; siteSortOrder.value = data.sort_order || 'newest'; currentTheme.value = siteTheme.value }
}
const updateSettings = async () => {
  if (!siteTitle.value || !marqueeText.value) return alert('名稱與跑馬燈必填！')
  await supabase.from('site_settings').upsert({ id: 1, title: siteTitle.value, marquee_text: marqueeText.value, theme: siteTheme.value, sort_order: siteSortOrder.value })
  currentTheme.value = siteTheme.value; alert('設定已更新！')
}

// 私密分頁
const loadAdminTabs = async () => {
  const { data } = await supabase.from('admin_tabs').select('*').order('created_at', { ascending: true })
  if (data) { adminTabs.value = data; if (data.length > 0 && !activeAdminTab.value) activeAdminTab.value = data[0].id }
}
const addAdminTab = async () => {
  if (!newAdminTabName.value) return alert('請輸入分頁名稱')
  const { data, error } = await supabase.from('admin_tabs').insert([{ name: newAdminTabName.value }]).select().single()
  if (!error && data) { newAdminTabName.value = ''; await loadAdminTabs(); activeAdminTab.value = data.id }
}
const deleteAdminTab = async (id) => {
  if (!confirm('確定刪除此分頁？')) return
  await supabase.from('admin_tabs').delete().eq('id', id); if (activeAdminTab.value === id) activeAdminTab.value = null; loadAdminTabs(); loadAdminNotes()
}
const startEditTab = (tab) => { editingTabId.value = tab.id; editingTabName.value = tab.name }
const saveTabName = async (tab) => {
  if (!editingTabName.value) return alert('名稱不能為空！')
  const { error } = await supabase.from('admin_tabs').update({ name: editingTabName.value }).eq('id', tab.id)
  if (!error) { editingTabId.value = null; loadAdminTabs() } else alert('更新失敗')
}

// 私密分頁 CSV
const exportAdminNotesCSV = () => {
  const notes = filteredAdminNotes.value; if (!notes.length) return alert('無資料匯出！')
  let csvContent = ['標題(title)', '內容說明(description)', '主網址(url)', '是否置頂(is_pinned)', '是否重要(is_important)', '額外網址(links_json)'].join(',') + '\n'
  notes.forEach(n => {
    csvContent += [`"${(n.title||'').replace(/"/g, '""')}"`, `"${(n.description||'').replace(/"/g, '""')}"`, `"${(n.url||'').replace(/"/g, '""')}"`, n.is_pinned?'TRUE':'FALSE', n.is_important?'TRUE':'FALSE', `"${JSON.stringify(n.links||[]).replace(/"/g, '""')}"`].join(',') + '\n'
  })
  const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })); link.download = `私密分頁備份_${currentTabName.value}.csv`; link.click()
}
const csvFileInput = ref(null); const triggerImportCsv = () => { csvFileInput.value.click() }
const handleCsvImport = async (event) => {
  const file = event.target.files[0]; if (!file) return
  const reader = new FileReader()
  reader.onload = async (e) => {
    const rows = parseCSVString(e.target.result); if (rows.length < 2) return alert('CSV 錯誤！')
    const insertData = []
    for (let i = 1; i < rows.length; i++) {
      if (rows[i].length < 6) continue 
      let parsedLinks = []; try { parsedLinks = JSON.parse(rows[i][5]) } catch(e) {}
      insertData.push({ tab_id: activeAdminTab.value, title: rows[i][0], description: rows[i][1], url: rows[i][2], is_pinned: rows[i][3].trim().toUpperCase() === 'TRUE', is_important: rows[i][4].trim().toUpperCase() === 'TRUE', links: parsedLinks })
    }
    if (insertData.length > 0) { await supabase.from('admin_notes').insert(insertData); alert(`成功匯入 ${insertData.length} 筆`); loadAdminNotes() }
    csvFileInput.value.value = '' 
  }
  reader.readAsText(file)
}

// 私密內容
const loadAdminNotes = async () => { const { data } = await supabase.from('admin_notes').select('*'); if (data) adminNotes.value = data }
const addAdminNote = async () => {
  if (!newAdminNote.value.title) return alert('標題必填！')
  await supabase.from('admin_notes').insert([{ ...newAdminNote.value, tab_id: activeAdminTab.value }]); newAdminNote.value = { title: '', description: '', url: '', is_important: false, is_pinned: false, links: [] }; loadAdminNotes()
}
const deleteAdminNote = async (id) => { if (confirm('確定刪除？')) { await supabase.from('admin_notes').delete().eq('id', id); loadAdminNotes() } }
const startEditAdminNote = (note) => { editingAdminNote.value = JSON.parse(JSON.stringify({ ...note, links: note.links || [] })) }
const cancelEditAdminNote = () => { editingAdminNote.value = null }
const saveAdminNote = async () => {
  if (!editingAdminNote.value.title) return alert('標題必填！')
  await supabase.from('admin_notes').update({ title: editingAdminNote.value.title, description: editingAdminNote.value.description, url: editingAdminNote.value.url, links: editingAdminNote.value.links, is_important: editingAdminNote.value.is_important, is_pinned: editingAdminNote.value.is_pinned }).eq('id', editingAdminNote.value.id); editingAdminNote.value = null; loadAdminNotes()
}
const addLinkToObj = (obj) => { if (!obj.links) obj.links = []; obj.links.push({ name: '', url: '' }) }
const removeLinkFromObj = (obj, index) => { obj.links.splice(index, 1) }

// 前台公告
const loadBulletins = async () => { const { data } = await supabase.from('bulletins').select('*').order('is_pinned', { ascending: false }).order('created_at', { ascending: false }); if (data) adminBulletins.value = data }
const addPost = async () => {
  if (!newPost.value.title || !newPost.value.url) return alert('標題與網址必填！')
  await supabase.from('bulletins').insert([{ ...newPost.value }]); alert('發布成功！'); newPost.value = getEmptyPost(); loadBulletins() 
}
const deletePost = async (id) => { if (confirm('確定刪除？')) { await supabase.from('bulletins').delete().eq('id', id); loadBulletins() } }
const formatDate = (dateString) => dayjs(dateString).format('YYYY/MM/DD HH:mm')

// 外部保活
const loadVisitorLogs = async () => { const { data } = await supabase.from('visitor_logs').select('*').order('visited_at', { ascending: false }).limit(10); if (data) visitorLogs.value = data }
const loadKeepAliveUrls = async () => { const { data } = await supabase.from('keep_alive_urls').select('*').order('created_at', { ascending: false }); if (data) keepAliveUrls.value = data }
const addKeepAliveUrl = async () => {
  if (!newKeepAlive.value.name || !newKeepAlive.value.url) return alert('必填！')
  await supabase.from('keep_alive_urls').insert([{ ...newKeepAlive.value }]); newKeepAlive.value = { name: '', url: '', home_url: '', platform: 'Vercel' }; loadKeepAliveUrls()
}
const deleteKeepAliveUrl = async (id) => { if (confirm('確定刪除？')) { await supabase.from('keep_alive_urls').delete().eq('id', id); loadKeepAliveUrls() } }
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))
const pingUrlsByPlatform = async (platform) => {
  const targetUrls = platform === 'Vercel' ? vercelUrls.value : renderUrls.value
  if (targetUrls.length === 0) return
  isPinging.value = true; isPingingPlatform.value = platform; pingResult.value = ''; let successCount = 0
  for (const item of targetUrls) {
    try { const urlObj = new URL(item.url); urlObj.searchParams.append('_ping_ts', Date.now().toString()); await fetch(urlObj.toString(), { method: 'GET', mode: 'no-cors', cache: 'no-store' }); successCount++; await delay(300) } catch (error) {}
  }
  isPinging.value = false; isPingingPlatform.value = ''; pingResult.value = `${platform} 喚醒完成！成功發送 ${successCount}/${targetUrls.length} 個請求。`; setTimeout(() => { pingResult.value = '' }, 4000)
  if (platform === 'Render') { setTimeout(() => { showRenderToast.value = true; setTimeout(() => { showRenderToast.value = false }, 10000) }, 60000) }
}
</script>

<style scoped>
.animate-fade-in { animation: fadeIn 0.3s ease-in-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
@keyframes bounce-in { 0% { transform: translateY(150%); opacity: 0; } 50% { transform: translateY(-10%); } 100% { transform: translateY(0); opacity: 1; } }
.animate-bounce-in { animation: bounce-in 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
</style>