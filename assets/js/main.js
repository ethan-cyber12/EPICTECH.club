'use strict';
const menuButton = document.querySelector('[data-menu-button]');
const navLinks = document.querySelector('[data-nav-links]');
if (menuButton && navLinks) {
  menuButton.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    menuButton.setAttribute('aria-expanded', String(isOpen));
  });
}
const year = document.querySelector('[data-year]');
if (year) year.textContent = new Date().getFullYear();

const clean = (value, max) => String(value || '')
  .replace(/[<>`{}]/g, '')
  .replace(/\s+/g, ' ')
  .trim()
  .slice(0, max);

document.querySelectorAll('[data-mailto-form]').forEach((form) => {
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const name = clean(data.get('name'), 80);
    const email = clean(data.get('email'), 120);
    const service = clean(data.get('service'), 80);
    const message = clean(data.get('message'), 900);
    const subject = encodeURIComponent(`EPIC TECH request: ${service || 'General'}`);
    const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\nService: ${service}\n\nWhat I need help with:\n${message}`);
    window.location.href = `mailto:info@epictech.club?subject=${subject}&body=${body}`;
  });
});
