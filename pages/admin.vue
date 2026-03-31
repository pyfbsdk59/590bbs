<template>
  <div class="mt-10 bg-white p-6 md:p-10 rounded-xl shadow-lg transition-colors duration-300">
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold">後台管理</h2>
      <button v-if="isAuthenticated" @click="logout" class="text-gray-500 hover:text-red-600 text-sm font-bold flex items-center gap-1 transition-colors">
        🚪 登出
      </button>
    </div>

    <div v-if="!isAuthenticated" class="space-y-4">
      <label class="block text-sm font-medium text-gray-700">請輸入今日動態密碼</label>
      <input 
        v-model="inputPassword" 
        type="password" 
        class="border border-gray-300 rounded p-2 w-full focus:outline-none focus:ring-2 focus:border-transparent transition-shadow"
        :class="themeObj.ring"
        @keyup.enter="login"
      >
      <p v-if="errorMsg" class="text-red-500 text-sm">{{ errorMsg }}</p>
      <button @click="login" :class="[themeObj.bg, themeObj.hover, 'text-white px-4 py-2 rounded w-full transition duration-300']">
        登入
      </button>
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
            <div class="md:w-1/3">
              <label class="block text-sm text-gray-600 mb-1">網站風格主題</label>
              <select v-model="siteTheme" :class="['border border-gray-300 p-2 w-full rounded focus:outline-none focus:ring-2 focus:border-transparent bg-white', themeObj.ring]">
                <option v-for="(config, key) in themeConfig" :key="key" :value="key">
                  {{ config.label }}
                </option>
              </select>
            </div>
          </div>
          <div>
            <label class="block text-sm text-gray-600 mb-1">跑馬燈內容</label>
            <input v-model="marqueeText" type="text" :class="['border border-gray-300 p-2 w-full rounded focus:outline-none focus:ring-2 focus:border-transparent', themeObj.ring]">
          </div>
          <button @click="updateSettings" :class="[themeObj.bg, themeObj.hover, 'text-white px-6 py-2 rounded font-medium transition duration-300 shadow-sm']">
            儲存全域設定
          </button>
        </div>
      </section>

      <section class="border-b pb-6">
        <h3 class="text-xl font-semibold mb-4">新增教學內容</h3>
        <div class="space-y-3">
          <div>
            <label class="block text-sm text-gray-600 mb-1">所屬科目分類</label>
            <select v-model="newPost.category" :class="['border border-gray-300 p-2 w-full rounded focus:outline-none focus:ring-2 focus:border-transparent bg-white', themeObj.ring]">
              <option value="資訊科技">💻 資訊科技</option>
              <option value="英語">🔤 英語</option>
            </select>
          </div>
          <div>
            <label class="block text-sm text-gray-600 mb-1">教學標題 (必填)</label>
            <input v-model="newPost.title" type="text" placeholder="輸入標題..." :class="['border border-gray-300 p-2 w-full rounded focus:outline-none focus:ring-2 focus:border-transparent', themeObj.ring]">
          </div>
          <div>
            <label class="block text-sm text-gray-600 mb-1">內容說明</label>
            <textarea v-model="newPost.description" placeholder="簡單描述一下這個教學..." :class="['border border-gray-300 p-2 w-full rounded focus:outline-none focus:ring-2 focus:border-transparent rows-3', themeObj.ring]"></textarea>
          </div>
          <div>
            <label class="block text-sm text-gray-600 mb-1">超連結網址 (必填)</label>
            <input v-model="newPost.url" type="url" placeholder="https://..." :class="['border border-gray-300 p-2 w-full rounded focus:outline-none focus:ring-2 focus:border-transparent', themeObj.ring]">
          </div>
          <button @click="addPost" :class="[themeObj.bg, themeObj.hover, 'text-white px-6 py-2 rounded font-medium transition duration-300 shadow-sm']">
            發布內容
          </button>
        </div>
      </section>

      <section class="border-b pb-6">
        <h3 class="text-xl font-semibold mb-4">管理教學內容</h3>

        <div v-if="editingPost" class="bg-gray-50 p-4 rounded-lg border border-gray-300 shadow-sm space-y-3 mb-4 animate-fade-in">
          <div class="flex justify-between items-center mb-2">
            <h4 class="font-bold text-gray-800">✏️ 編輯教學內容</h4>
            <button @click="cancelEdit" class="text-gray-500 hover:text-red-500 text-sm font-bold">✖ 取消</button>
          </div>
          <div class="flex flex-col md:flex-row gap-3">
            <div class="md:w-1/3">
              <label class="block text-xs text-gray-500 mb-1">分類</label>
              <select v-model="editingPost.category" :class="['border border-gray-300 p-2 w-full rounded focus:outline-none focus:ring-2 focus:border-transparent bg-white text-sm', themeObj.ring]">
                <option value="資訊科技">💻 資訊科技</option>
                <option value="英語">🔤 英語</option>
              </select>
            </div>
            <div class="flex-1">
              <label class="block text-xs text-gray-500 mb-1">標題</label>
              <input v-model="editingPost.title" type="text" :class="['border border-gray-300 p-2 w-full rounded focus:outline-none focus:ring-2 focus:border-transparent text-sm', themeObj.ring]">
            </div>
          </div>
          <div>
            <label class="block text-xs text-gray-500 mb-1">說明</label>
            <textarea v-model="editingPost.description" :class="['border border-gray-300 p-2 w-full rounded focus:outline-none focus:ring-2 focus:border-transparent text-sm rows-2', themeObj.ring]"></textarea>
          </div>
          <div>
            <label class="block text-xs text-gray-500 mb-1">網址</label>
            <input v-model="editingPost.url" type="url" :class="['border border-gray-300 p-2 w-full rounded focus:outline-none focus:ring-2 focus:border-transparent text-sm', themeObj.ring]">
          </div>
          <div class="flex justify-end gap-2 mt-3">
            <button @click="cancelEdit" class="px-4 py-2 rounded text-sm text-gray-700 bg-gray-200 hover:bg-gray-300 transition-colors font-medium">取消</button>
            <button @click="saveEdit" :class="[themeObj.bg, themeObj.hover, 'text-white px-4 py-2 rounded text-sm transition-colors font-medium']">儲存變更</button>
          </div>
        </div>

        <ul v-else class="space-y-3 max-h-[400px] overflow-y-auto pr-2">
          <li v-for="item in adminBulletins" :key="item.id" class="flex flex-col md:flex-row justify-between md:items-center bg-white p-3 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div class="flex flex-col mb-2 md:mb-0">
              <div class="flex items-center gap-2">
                <span :class="item.category === '資訊科技' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'" class="text-xs font-bold px-2 py-0.5 rounded whitespace-nowrap">
                  {{ item.category }}
                </span>
                <span class="font-bold text-gray-800 text-lg">{{ item.title }}</span>
              </div>
              <span class="text-xs text-gray-500 mt-1 truncate max-w-xs md:max-w-md" :title="item.url">🔗 {{ item.url }}</span>
            </div>
            <div class="flex gap-2 self-end md:self-auto mt-2 md:mt-0">
              <button @click="startEdit(item)" :class="['text-sm px-3 py-1 rounded border transition-colors font-medium', themeObj.text, themeObj.bg.replace('bg-', 'border-'), themeObj.bg.replace('bg-', 'hover:bg-').replace('600', '50')]">編輯</button>
              <button @click="deletePost(item.id)" class="text-red-500 hover:bg-red-500 hover:text-white text-sm px-3 py-1 rounded border border-transparent hover:border-red-600 transition-colors font-medium">刪除</button>
            </div>
          </li>
          <li v-if="adminBulletins.length === 0" class="text-sm text-gray-400 py-6 text-center bg-gray-50 rounded-lg border border-dashed border-gray-300">
            目前沒有任何教學內容。
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
          <select v-model="newKeepAlive.platform" :class="['border border-gray-300 p-2 rounded text-sm bg-white focus:outline-none focus:ring-2 focus:border-transparent', themeObj.ring]">
            <option value="Vercel">Vercel 專案</option>
            <option value="Render">Render 專案</option>
          </select>
          <input v-model="newKeepAlive.name" type="text" placeholder="網站名稱" :class="['border border-gray-300 p-2 w-full md:w-32 rounded text-sm focus:outline-none focus:ring-2 focus:border-transparent', themeObj.ring]">
          <input v-model="newKeepAlive.url" type="url" placeholder="喚醒 API 網址 (必填)" :class="['border border-gray-300 p-2 flex-1 rounded text-sm focus:outline-none focus:ring-2 focus:border-transparent', themeObj.ring]">
          <input v-model="newKeepAlive.home_url" type="url" placeholder="真正首頁網址 (選填)" :class="['border border-gray-300 p-2 flex-1 rounded text-sm focus:outline-none focus:ring-2 focus:border-transparent', themeObj.ring]">
          <button @click="addKeepAliveUrl" :class="[themeObj.bg, themeObj.hover, 'text-white px-5 py-2 rounded text-sm font-medium whitespace-nowrap transition-colors shadow-sm']">
            新增網站
          </button>
        </div>

        <div class="space-y-6">
          <div>
            <h4 class="text-sm font-bold text-gray-500 mb-2 uppercase tracking-wider">▲ Vercel 專案</h4>
            <ul class="space-y-2">
              <li v-for="item in vercelUrls" :key="item.id" class="flex flex-col md:flex-row justify-between md:items-center bg-white p-3 rounded-lg border-l-4 border-l-gray-800 border-gray-200 shadow-sm">
                <div class="flex flex-col mb-2 md:mb-0">
                  <span class="font-bold text-gray-800">{{ item.name }}</span>
                  <div class="flex flex-col md:flex-row md:items-center gap-2 mt-1">
                    <span class="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded truncate max-w-xs md:max-w-md">⚡ API: {{ item.url }}</span>
                    <a v-if="item.home_url" :href="item.home_url" target="_blank" :class="['inline-flex items-center justify-center text-xs font-bold bg-opacity-10 hover:bg-opacity-20 px-3 py-1 rounded-md transition-colors w-fit', themeObj.text, themeObj.bg.replace('bg-', 'bg-').replace('600', '100')]">🔗 開啟首頁</a>
                  </div>
                </div>
                <button @click="deleteKeepAliveUrl(item.id)" class="text-red-500 hover:bg-red-500 hover:text-white text-sm px-3 py-1 rounded border border-transparent hover:border-red-600 transition-colors self-end md:self-auto mt-2 md:mt-0">刪除</button>
              </li>
              <li v-if="vercelUrls.length === 0" class="text-sm text-gray-400 py-2 bg-gray-50 text-center rounded border border-dashed border-gray-300">目前沒有 Vercel 專案。</li>
            </ul>
          </div>
          <div>
            <h4 class="text-sm font-bold text-purple-500 mb-2 uppercase tracking-wider">◆ Render 專案</h4>
            <ul class="space-y-2">
              <li v-for="item in renderUrls" :key="item.id" class="flex flex-col md:flex-row justify-between md:items-center bg-white p-3 rounded-lg border-l-4 border-l-purple-500 border-gray-200 shadow-sm">
                <div class="flex flex-col mb-2 md:mb-0">
                  <span class="font-bold text-gray-800">{{ item.name }}</span>
                  <div class="flex flex-col md:flex-row md:items-center gap-2 mt-1">
                    <span class="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded truncate max-w-xs md:max-w-md">⚡ API: {{ item.url }}</span>
                    <a v-if="item.home_url" :href="item.home_url" target="_blank" :class="['inline-flex items-center justify-center text-xs font-bold bg-opacity-10 hover:bg-opacity-20 px-3 py-1 rounded-md transition-colors w-fit', themeObj.text, themeObj.bg.replace('bg-', 'bg-').replace('600', '100')]">🔗 開啟首頁</a>
                  </div>
                </div>
                <button @click="deleteKeepAliveUrl(item.id)" class="text-red-500 hover:bg-red-500 hover:text-white text-sm px-3 py-1 rounded border border-transparent hover:border-red-600 transition-colors self-end md:self-auto mt-2 md:mt-0">刪除</button>
              </li>
              <li v-if="renderUrls.length === 0" class="text-sm text-gray-400 py-2 bg-gray-50 text-center rounded border border-dashed border-gray-300">目前沒有 Render 專案。</li>
            </ul>
          </div>
        </div>
      </section>

      <section>
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-xl font-semibold">本站來訪紀錄</h3>
          <button @click="loadVisitorLogs" :class="['text-sm hover:opacity-75 underline transition-opacity', themeObj.text]">重新整理</button>
        </div>
        <div class="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
          <table class="min-w-full bg-white text-sm text-left">
            <thead class="bg-gray-100 border-b">
              <tr>
                <th class="p-3 font-medium text-gray-700 w-1/4">時間</th>
                <th class="p-3 font-medium text-gray-700 w-1/4">IP 位址</th>
                <th class="p-3 font-medium text-gray-700 w-1/2">設備 (User-Agent)</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="log in visitorLogs" :key="log.id" class="border-b hover:bg-gray-50">
                <td class="p-3 whitespace-nowrap text-gray-600">{{ formatDate(log.visited_at) }}</td>
                <td :class="['p-3 font-mono', themeObj.text]">{{ log.ip_address }}</td>
                <td class="p-3 text-gray-600 truncate max-w-xs" :title="log.user_agent">{{ log.user_agent }}</td>
              </tr>
              <tr v-if="visitorLogs.length === 0">
                <td colspan="3" class="p-5 text-center text-gray-500">目前尚無來訪紀錄</td>
              </tr>
            </tbody>
          </table>
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

// ====== 全域主題狀態 ======
const currentTheme = useState('currentTheme')
const themeObj = computed(() => themeConfig[currentTheme.value] || themeConfig.purple)

// ====== 狀態變數 ======
const isAuthenticated = ref(false)
const inputPassword = ref('')
const errorMsg = ref('')

const siteTitle = ref('')
const marqueeText = ref('')
const siteTheme = ref('purple')

// 教學公告變數
const newPost = ref({ title: '', description: '', url: '', category: '資訊科技' }) 
const adminBulletins = ref([]) // 存放要管理的公告列表
const editingPost = ref(null)  // 目前正在編輯的公告

const visitorLogs = ref([])

const keepAliveUrls = ref([])
const newKeepAlive = ref({ name: '', url: '', home_url: '', platform: 'Vercel' })
const isPinging = ref(false)
const isPingingPlatform = ref('')
const pingResult = ref('')

const vercelUrls = computed(() => keepAliveUrls.value.filter(item => item.platform === 'Vercel' || !item.platform))
const renderUrls = computed(() => keepAliveUrls.value.filter(item => item.platform === 'Render'))

// ====== 核心登入與設定 ======

const login = () => {
  const correctPassword = getTodayPassword()
  if (inputPassword.value === correctPassword) {
    isAuthenticated.value = true
    errorMsg.value = ''
    loadSettings()
    loadVisitorLogs()
    loadKeepAliveUrls()
    loadBulletins() // 登入後自動載入公告清單
  } else {
    errorMsg.value = '密碼錯誤！'
  }
}

const logout = () => {
  isAuthenticated.value = false
  inputPassword.value = ''
}

const loadSettings = async () => {
  const { data } = await supabase.from('site_settings').select('*').eq('id', 1).single()
  if (data) {
    siteTitle.value = data.title
    marqueeText.value = data.marquee_text
    siteTheme.value = data.theme || 'purple'
    currentTheme.value = siteTheme.value
  }
}

const updateSettings = async () => {
  if (!siteTitle.value || !marqueeText.value) return alert('網站名稱與跑馬燈內容不可為空！')
  await supabase.from('site_settings').upsert({ id: 1, title: siteTitle.value, marquee_text: marqueeText.value, theme: siteTheme.value })
  currentTheme.value = siteTheme.value 
  alert('設定已更新！')
}

// ====== 公告管理邏輯 (新增、編輯、刪除) ======

// 載入所有公告供後台管理
const loadBulletins = async () => {
  const { data } = await supabase.from('bulletins').select('*').order('created_at', { ascending: false })
  if (data) adminBulletins.value = data
}

// 新增公告
const addPost = async () => {
  if (!newPost.value.title || !newPost.value.url) return alert('「教學標題」與「超連結網址」為必填欄位！')
  await supabase.from('bulletins').insert([{ ...newPost.value }])
  alert('發布成功！')
  newPost.value = { title: '', description: '', url: '', category: '資訊科技' }
  loadBulletins() // 新增後立刻重新載入列表
}

// 刪除公告
const deletePost = async (id) => {
  if (!confirm('確定要刪除這筆教學內容嗎？此動作無法復原。')) return
  await supabase.from('bulletins').delete().eq('id', id)
  loadBulletins()
}

// 進入編輯模式
const startEdit = (post) => {
  editingPost.value = { ...post } // 拷貝資料以供編輯，避免直接修改到列表中的畫面
}

// 取消編輯
const cancelEdit = () => {
  editingPost.value = null
}

// 儲存編輯變更
const saveEdit = async () => {
  if (!editingPost.value.title || !editingPost.value.url) return alert('標題與網址不可為空！')
  
  const { id, title, description, url, category } = editingPost.value
  const { error } = await supabase.from('bulletins').update({ title, description, url, category }).eq('id', id)
  
  if (error) {
    alert('更新失敗: ' + error.message)
  } else {
    alert('更新成功！')
    editingPost.value = null // 關閉編輯表單
    loadBulletins() // 重新載入列表
  }
}

// ====== 其他系統功能 ======

const loadVisitorLogs = async () => {
  const { data } = await supabase.from('visitor_logs').select('*').order('visited_at', { ascending: false }).limit(10)
  if (data) visitorLogs.value = data
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  return dayjs(dateString).format('YYYY/MM/DD HH:mm:ss')
}

const loadKeepAliveUrls = async () => {
  const { data } = await supabase.from('keep_alive_urls').select('*').order('created_at', { ascending: false })
  if (data) keepAliveUrls.value = data
}

const addKeepAliveUrl = async () => {
  if (!newKeepAlive.value.name || !newKeepAlive.value.url) return alert('名稱與喚醒 API 網址為必填！')
  try {
    new URL(newKeepAlive.value.url)
    if (newKeepAlive.value.home_url) new URL(newKeepAlive.value.home_url)
  } catch (e) {
    return alert('請輸入有效的網址 (需包含 http:// 或 https://)')
  }
  
  await supabase.from('keep_alive_urls').insert([{ ...newKeepAlive.value }])
  newKeepAlive.value = { name: '', url: '', home_url: '', platform: 'Vercel' }
  loadKeepAliveUrls()
}

const deleteKeepAliveUrl = async (id) => {
  if (!confirm('確定要刪除這個網站設定嗎？')) return
  await supabase.from('keep_alive_urls').delete().eq('id', id)
  loadKeepAliveUrls()
}

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

const pingUrlsByPlatform = async (platform) => {
  const targetUrls = platform === 'Vercel' ? vercelUrls.value : renderUrls.value
  if (targetUrls.length === 0) return
  
  isPinging.value = true
  isPingingPlatform.value = platform
  pingResult.value = ''
  
  let successCount = 0

  for (const item of targetUrls) {
    try {
      const urlObj = new URL(item.url)
      urlObj.searchParams.append('_ping_ts', Date.now().toString())
      await fetch(urlObj.toString(), { method: 'GET', mode: 'no-cors', cache: 'no-store' })
      successCount++
      await delay(300) 
    } catch (error) {
      console.error(`喚醒 ${item.name} 失敗:`, error)
    }
  }

  isPinging.value = false
  isPingingPlatform.value = ''
  pingResult.value = `${platform} 喚醒完成！成功發送 ${successCount}/${targetUrls.length} 個請求。`
  setTimeout(() => { pingResult.value = '' }, 4000)
}
</script>

<style scoped>
.animate-fade-in { animation: fadeIn 0.3s ease-in-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
</style>