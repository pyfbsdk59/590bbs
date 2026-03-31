<template>
  <div class="mt-10 bg-white p-6 md:p-10 rounded-xl shadow-lg">
    <h2 class="text-2xl font-bold mb-6">後台管理</h2>

    <div v-if="!isAuthenticated" class="space-y-4">
      <label class="block text-sm font-medium text-gray-700">請輸入今日動態密碼</label>
      <input 
        v-model="inputPassword" 
        type="password" 
        class="border border-gray-300 rounded p-2 w-full focus:ring-blue-500 focus:border-blue-500"
        placeholder="YYMMDD"
        @keyup.enter="login"
      >
      <p v-if="errorMsg" class="text-red-500 text-sm">{{ errorMsg }}</p>
      <button @click="login" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full transition duration-200">
        登入
      </button>
    </div>

    <div v-else class="space-y-8">
      
      <section class="border-b pb-6">
        <h3 class="text-xl font-semibold mb-4">網站全域設定</h3>
        <div class="space-y-3">
          <div>
            <label class="block text-sm text-gray-600 mb-1">網站名稱</label>
            <input v-model="siteTitle" type="text" placeholder="例如：我的教學佈告欄" class="border border-gray-300 p-2 w-full rounded focus:ring-blue-500 focus:border-blue-500">
          </div>
          <div>
            <label class="block text-sm text-gray-600 mb-1">跑馬燈內容</label>
            <input v-model="marqueeText" type="text" placeholder="例如：歡迎同學！請點擊下方連結..." class="border border-gray-300 p-2 w-full rounded focus:ring-blue-500 focus:border-blue-500">
          </div>
          <button @click="updateSettings" class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition duration-200">
            儲存設定
          </button>
        </div>
      </section>

      <section class="border-b pb-6">
        <h3 class="text-xl font-semibold mb-4">新增教學內容</h3>
        <div class="space-y-3">
          <div>
            <label class="block text-sm text-gray-600 mb-1">教學標題 (必填)</label>
            <input v-model="newPost.title" type="text" placeholder="輸入標題..." class="border border-gray-300 p-2 w-full rounded focus:ring-blue-500 focus:border-blue-500">
          </div>
          <div>
            <label class="block text-sm text-gray-600 mb-1">內容說明</label>
            <textarea v-model="newPost.description" placeholder="簡單描述一下這個教學..." class="border border-gray-300 p-2 w-full rounded focus:ring-blue-500 focus:border-blue-500 rows-3"></textarea>
          </div>
          <div>
            <label class="block text-sm text-gray-600 mb-1">超連結網址 (必填)</label>
            <input v-model="newPost.url" type="url" placeholder="https://..." class="border border-gray-300 p-2 w-full rounded focus:ring-blue-500 focus:border-blue-500">
          </div>
          <button @click="addPost" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition duration-200">
            發布內容
          </button>
        </div>
      </section>

      <section>
        <h3 class="text-xl font-semibold mb-4">近期來訪紀錄 (保活系統)</h3>
        <div class="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
          <table class="min-w-full bg-white text-sm text-left">
            <thead class="bg-gray-100 border-b">
              <tr>
                <th class="p-3 font-medium text-gray-700">時間</th>
                <th class="p-3 font-medium text-gray-700">IP 位址</th>
                <th class="p-3 font-medium text-gray-700">設備 (User-Agent)</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="log in visitorLogs" :key="log.id" class="border-b hover:bg-gray-50">
                <td class="p-3 whitespace-nowrap text-gray-600">{{ formatDate(log.visited_at) }}</td>
                <td class="p-3 text-blue-600 font-mono">{{ log.ip_address }}</td>
                <td class="p-3 text-gray-600 truncate max-w-xs" :title="log.user_agent">{{ log.user_agent }}</td>
              </tr>
              <tr v-if="visitorLogs.length === 0">
                <td colspan="3" class="p-5 text-center text-gray-500">目前尚無來訪紀錄</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="mt-4 flex justify-end">
          <button @click="loadVisitorLogs" class="text-sm text-blue-600 hover:text-blue-800 underline">
            重新整理紀錄
          </button>
        </div>
      </section>

    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { getTodayPassword } from '@/utils/auth'

// 使用 Nuxt 內建的 dayjs composable (來自 dayjs-nuxt 模組)
const dayjs = useDayjs()
const supabase = useSupabaseClient()

// ====== 狀態變數 ======
const isAuthenticated = ref(false)
const inputPassword = ref('')
const errorMsg = ref('')

const siteTitle = ref('')
const marqueeText = ref('')
const newPost = ref({ title: '', description: '', url: '' })
const visitorLogs = ref([])

// ====== 核心功能 ======

// 登入驗證
const login = () => {
  const correctPassword = getTodayPassword()
  if (inputPassword.value === correctPassword) {
    isAuthenticated.value = true
    errorMsg.value = ''
    loadSettings()
    loadVisitorLogs()
  } else {
    errorMsg.value = '密碼錯誤！請輸入台灣時間的 YYMMDD 格式。'
  }
}

// 載入當前網站設定
const loadSettings = async () => {
  const { data, error } = await supabase
    .from('site_settings')
    .select('*')
    .eq('id', 1)
    .single()
    
  if (data) {
    siteTitle.value = data.title
    marqueeText.value = data.marquee_text
  } else if (error) {
    console.error('讀取設定失敗:', error)
  }
}

// 儲存網站設定
const updateSettings = async () => {
  if (!siteTitle.value || !marqueeText.value) {
    alert('網站名稱與跑馬燈內容不可為空！')
    return
  }

  const { error } = await supabase
    .from('site_settings')
    .upsert({ 
      id: 1, 
      title: siteTitle.value, 
      marquee_text: marqueeText.value 
    })
    
  if (error) {
    alert('設定更新失敗，請檢查 Console 錯誤訊息')
    console.error(error)
  } else {
    alert('設定已更新！重新整理前台頁面即可看到變化。')
  }
}

// 發布新教學內容
const addPost = async () => {
  if (!newPost.value.title || !newPost.value.url) {
    alert('「教學標題」與「超連結網址」為必填欄位！')
    return
  }
  
  const { error } = await supabase
    .from('bulletins')
    .insert([{ ...newPost.value }])
    
  if (error) {
    alert('發布失敗，請檢查 Console 錯誤訊息')
    console.error(error)
  } else {
    alert('發布成功！')
    newPost.value = { title: '', description: '', url: '' } // 清空表單
  }
}

// 載入最近 10 筆來訪紀錄
const loadVisitorLogs = async () => {
  const { data, error } = await supabase
    .from('visitor_logs')
    .select('*')
    .order('visited_at', { ascending: false })
    .limit(10)
  
  if (data) {
    visitorLogs.value = data
  } else if (error) {
    console.error('讀取來訪紀錄失敗:', error)
  }
}

// 格式化時間為台灣時間 (YYYY/MM/DD HH:mm:ss)
const formatDate = (dateString) => {
  if (!dateString) return ''
  // 由於我們在 nuxt.config.ts 已經設定 defaultTimezone 為 Asia/Taipei，直接 format 即可
  return dayjs(dateString).format('YYYY/MM/DD HH:mm:ss')
}
</script>