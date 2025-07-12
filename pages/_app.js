import '../styles/globals.css';
import { Tajawal } from 'next/font/google';

// 1. قم بتكوين الخط مع الأوزان التي تحتاجها
const tajawalFont = Tajawal({
  subsets: ['arabic'],
  weight: ['400', '500', '700'],
  display: 'swap', // يضمن ظهور النص بخط بديل حتى يتم تحميل الخط الرئيسي
  variable: '--font-tajawal', // إنشاء متغير CSS لاستخدامه بسهولة
});

function MyApp({ Component, pageProps }) {
  // 2. طبق المتغير على كامل التطبيق
  return (
    <main className={`${tajawalFont.variable}`}>
      <Component {...pageProps} />
    </main>
  );
}

export default MyApp;