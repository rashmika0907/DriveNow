document.addEventListener('DOMContentLoaded', () => {
  const faqItems = document.querySelectorAll('.faq-accordion-item');
  
  faqItems.forEach(item => {
    const summary = item.querySelector('summary');
    const caret = summary.querySelector('.faq-caret');
    
    item.addEventListener('toggle', () => {
      if (item.open) {
        caret.textContent = '^';
      } else {
        caret.textContent = 'v';
      }
    });
  });
});

