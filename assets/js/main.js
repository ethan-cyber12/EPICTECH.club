'use strict';
const menuButton=document.querySelector('[data-menu-button]');
const navLinks=document.querySelector('[data-nav-links]');
if(menuButton&&navLinks){menuButton.addEventListener('click',()=>{const isOpen=navLinks.classList.toggle('open');menuButton.setAttribute('aria-expanded',String(isOpen));});}
const year=document.querySelector('[data-year]');if(year){year.textContent=new Date().getFullYear();}
const contactForms=document.querySelectorAll('[data-mailto-form]');
contactForms.forEach(form=>{form.addEventListener('submit',event=>{event.preventDefault();const data=new FormData(form);const name=String(data.get('name')||'').slice(0,80);const service=String(data.get('service')||'').slice(0,80);const message=String(data.get('message')||'').slice(0,900);const subject=encodeURIComponent(`EPIC TECH inquiry: ${service || 'General'}`);const body=encodeURIComponent(`Name: ${name}\nService: ${service}\n\nMessage:\n${message}`);window.location.href=`mailto:info@epictech.club?subject=${subject}&body=${body}`;});});
