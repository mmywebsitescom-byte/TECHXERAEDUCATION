
import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'TechXera Campus Portal',
    short_name: 'TechXera',
    description: 'Management ecosystem for TechXera students and administrators.',
    start_url: '/',
    display: 'standalone',
    background_color: '#280905',
    theme_color: '#C3110C',
    icons: [
      {
        src: 'favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
      {
        src: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect width=%22100%22 height=%22100%22 rx=%2220%22 fill=%22%23280905%22/><path d=%22M30 35 L50 20 L70 35 L70 65 L50 80 L30 65 Z%22 fill=%22none%22 stroke=%22%23C3110C%22 stroke-width=%225%22/><circle cx=%2250%22 cy=%2250%22 r=%2210%22 fill=%22%23E6501B%22/></svg>',
        sizes: '192x192',
        type: 'image/svg+xml',
      },
      {
        src: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect width=%22100%22 height=%22100%22 rx=%2220%22 fill=%22%23280905%22/><path d=%22M30 35 L50 20 L70 35 L70 65 L50 80 L30 65 Z%22 fill=%22none%22 stroke=%22%23C3110C%22 stroke-width=%225%22/><circle cx=%2250%22 cy=%2250%22 r=%2210%22 fill=%22%23E6501B%22/></svg>',
        sizes: '512x512',
        type: 'image/svg+xml',
      },
    ],
  }
}
