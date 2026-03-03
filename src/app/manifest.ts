
import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'TechXera Campus Portal',
    short_name: 'TechXera',
    description: 'Management ecosystem for TechXera students and administrators.',
    start_url: '/',
    display: 'standalone',
    background_color: '#280905',
    theme_color: '#C3110C'
  }
}
