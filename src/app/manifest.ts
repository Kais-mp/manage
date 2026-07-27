import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'Laptop Management System',
    short_name: 'LapTrack',
    description:
      'Professional laptop inventory, asset tracking, and management platform.',

    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',

    background_color: '#ffffff',
    theme_color: '#0f172a',

    lang: 'en',
    dir: 'ltr',

    categories: ['business', 'productivity', 'utilities'],

    icons: [
      {
        src: '/icon.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/maskable-icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    screenshots: [
  {
    src: '/screenshots/dashboard-desktop.png',
    sizes: '1280x720',
    type: 'image/png',
    form_factor: 'wide',
    label: 'Dashboard Overview',
  },
  {
    src: '/screenshots/inventory-desktop.png',
    sizes: '1280x720',
    type: 'image/png',
    form_factor: 'wide',
    label: 'Inventory Management',
  },
  {
    src: '/screenshots/mobile-dashboard.png',
    sizes: '390x844',
    type: 'image/png',
    label: 'Mobile Experience',
  },
],

    shortcuts: [
      {
        name: 'Dashboard',
        short_name: 'Dashboard',
        description: 'View system dashboard',
        url: '/',
      },
      {
        name: 'Laptops',
        short_name: 'Laptops',
        description: 'Manage laptop inventory',
        url: '/inventory',
      },
      {
        name: 'Statistics',
        short_name: 'Stats',
        description: 'View inventory statistics',
        url: '/stats',
      },
      
      {
        name: 'Dealer',
        short_name: 'Dealers',
        description: 'View dealer information',
        url: '/dealers',
      },
     {
        name: 'Sales',
        short_name: 'Sales',
        description: 'View sales information',
        url: '/sales',
      },
    ],
  }
}
