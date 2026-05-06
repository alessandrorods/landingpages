'use client'

import { useEffect } from 'react'
import Hotjar from '@hotjar/browser'

const SITE_ID = 6706395
const HOTJAR_VERSION = 6

export default function HotjarInit() {
  useEffect(() => {
    Hotjar.init(SITE_ID, HOTJAR_VERSION)
  }, [])

  return null
}
