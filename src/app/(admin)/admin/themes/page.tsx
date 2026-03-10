import { ThemeManager } from '@/components/admin/theme-manager'
import { Card, CardContent } from '@/components/ui/card'

export default function ThemesPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">主题管理</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            管理博客主题，上传新主题或切换现有主题
          </p>
        </CardContent>
      </Card>
      
      <ThemeManager />
    </div>
  )
}
