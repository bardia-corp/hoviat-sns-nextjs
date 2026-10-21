import Link from "next/link"
import UIIcon from "@/components/UIIcon"
import SupportContact from "@/components/SupportContact"
import "./home-redesign.css"

export default function HomePage() {
  return <main className="screen home-page">
    <header className="home-intro">
      <p className="hero__eyebrow">هویت · همراه جامعهٔ فارسی‌زبان در آلمان</p>
      <h1>اینجا، پیدا کردن خدمات<br /><span>آشناتر می‌شود.</span></h1>
      <p className="home-lead">کسب‌وکارها و خدمات مرتبط با جامعهٔ ایرانی و فارسی‌زبان در آلمان را بشناسید؛ از خدمات به زبان فارسی تا کسب‌وکارهای ایرانی، در شهر شما.</p>
      <Link className="home-primary" href="/discover"><UIIcon name="search" />کشف کسب‌وکارها<UIIcon name="arrow" size={19} /></Link>
      <p className="home-intro-note">جست‌وجو و مشاهدهٔ کسب‌وکارها بدون نیاز به ورود</p>
    </header>
    <section className="home-value-grid" aria-label="با هویت چه کارهایی می‌توانید انجام دهید؟">
      <article className="home-value glass"><span className="home-icon"><UIIcon name="map" size={27} /></span><h2>از شهر خودتان شروع کنید</h2><p>شهر و دستهٔ خدمات را انتخاب کنید و گزینه‌های مرتبط را راحت‌تر پیدا کنید.</p><Link href="/discover">رفتن به جست‌وجو <UIIcon name="arrow" size={18} /></Link></article>
      <article className="home-value glass"><span className="home-icon"><UIIcon name="info" size={27} /></span><h2>بیشتر بشناسید، بعد انتخاب کنید</h2><p>معرفی، نشانی و راه‌های تماس منتشرشدهٔ هر کسب‌وکار را یک‌جا ببینید.</p><Link href="/discover">دیدن کسب‌وکارها <UIIcon name="arrow" size={18} /></Link></article>
      <article className="home-value glass"><span className="home-icon"><UIIcon name="bookmark" size={27} /></span><h2>برای وقت نیاز نگه دارید</h2><p>با ورود به حساب، کسب‌وکارهای موردنظرتان را در فهرست شخصی خود ذخیره کنید.</p><Link href="/business-bookmarks">ذخیره‌های من <UIIcon name="arrow" size={18} /></Link></article>
    </section>
    <section className="home-owner glass">
      <span className="home-icon"><UIIcon name="store" size={29} /></span>
      <div><h2>کسب‌وکارتان را به جامعهٔ فارسی‌زبان معرفی کنید</h2><p>برای اضافه شدن کسب‌وکارتان به هویت، با تیم پشتیبانی در تماس باشید.</p></div>
      <SupportContact />
    </section>
    <p className="home-owner-link">کسب‌وکارتان قبلاً اضافه شده؟ <Link href="/my-businesses">مدیریت کسب‌وکارهای من <UIIcon name="arrow" size={17} /></Link></p>
  </main>
}
