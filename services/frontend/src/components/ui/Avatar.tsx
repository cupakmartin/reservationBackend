interface AvatarProps {
  name: string
  avatarUrl?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function Avatar({ name, avatarUrl, size = 'md', className = '' }: AvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-20 h-20 text-xl'
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getAvatarUrl = (url?: string) => {
    if (!url) return null
    if (url.startsWith('http')) return url
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000'
    return `${API_BASE.replace('/api', '')}${url}`
  }

  const fullAvatarUrl = getAvatarUrl(avatarUrl)

  if (fullAvatarUrl) {
    return (
      <div className={`${sizeClasses[size]} rounded-full overflow-hidden bg-gray-200 ${className}`}>
        <img 
          src={fullAvatarUrl} 
          alt={name} 
          className="w-full h-full object-cover"
        />
      </div>
    )
  }

  return (
    <div className={`${sizeClasses[size]} rounded-full bg-blue-100 flex items-center justify-center font-semibold text-blue-600 ${className}`}>
      {getInitials(name)}
    </div>
  )
}
