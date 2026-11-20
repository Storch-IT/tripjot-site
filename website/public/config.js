/*
  Tripjot site settings — the only file you need to edit before going live.
  Налаштування сайту Tripjot — єдиний файл, який треба змінити перед запуском.
*/
window.TRIPJOT_CONFIG = {
  // Where the waitlist form sends sign-ups.
  // "auto" = Netlify Forms on the live site; test mode (nothing sent) on this computer.
  // Куди форма надсилає заявки. "auto" = на справжньому сайті в Netlify, на комп'ютері — тестовий режим.
  formEndpoint: "auto",

  // Contact email shown on the site and in the privacy policy.
  // Пошта для зв'язку — видно на сайті та в політиці конфіденційності.
  contactEmail: "hellotripjot@gmail.com",

  // Name of the person or business running Tripjot (for the privacy policy).
  // Ім'я власника (ФОП) — для політики конфіденційності.
  ownerName: "Andrii Storcheus",

  // Release day: put the App Store link here (e.g. "https://apps.apple.com/gb/app/tripjot/id1234567890").
  // Empty = waitlist mode. When filled, "Join the waitlist" buttons become App Store links,
  // and the waitlist form, the founders offer and "When does it launch?" are hidden.
  // День запуску: вставте сюди посилання на App Store. Порожньо — режим списку очікування.
  appStoreUrl: ""
};
