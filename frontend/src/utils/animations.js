export const animations = {
  pageEnter: {
    initial:    { opacity: 0, y: 8 },
    animate:    { opacity: 1, y: 0 },
    transition: { duration: 0.15, ease: 'easeOut' },
  },
  modalOverlay: {
    initial:    { opacity: 0 },
    animate:    { opacity: 1 },
    exit:       { opacity: 0 },
    transition: { duration: 0.15 },
  },
  modalContent: {
    initial:    { opacity: 0, scale: 0.95, y: -8 },
    animate:    { opacity: 1, scale: 1,    y: 0   },
    exit:       { opacity: 0, scale: 0.95          },
    transition: { duration: 0.15, ease: 'easeOut' },
  },
  toastEnter: {
    initial:    { opacity: 0, x: 48, scale: 0.95 },
    animate:    { opacity: 1, x: 0,  scale: 1    },
    exit:       { opacity: 0, x: 48               },
    transition: { duration: 0.3, ease: [0.175, 0.885, 0.32, 1.275] },
  },
  counterConfig: { duration: 1.5, separator: ',', useEasing: true },
}