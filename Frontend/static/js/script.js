// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';

// Helper function for API calls
async function apiCall(endpoint, method = 'GET', data = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
        }
    };

    if (data && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'API request failed');
        }

        return result;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Mobile Menu Toggle
const menuBtn = document.getElementById('menuBtn');
const mobileMenu = document.getElementById('mobileMenu');

menuBtn.addEventListener('click', () => {
    mobileMenu.classList.toggle('hidden');
});

// Close mobile menu when clicking on a link
const mobileLinks = document.querySelectorAll('.mobile-link');
mobileLinks.forEach(link => {
    link.addEventListener('click', () => {
        mobileMenu.classList.add('hidden');
    });
});

// Typing Animation
const typedElement = document.getElementById('typed');
const texts = [
    'Full Stack Developer',
    'Problem Solver',
    'Tech Enthusiast',
    'Creative Coder'
];
let textIndex = 0;
let charIndex = 0;
let isDeleting = false;
let typingSpeed = 100;

function typeText() {
    const currentText = texts[textIndex];
    
    if (isDeleting) {
        typedElement.textContent = currentText.substring(0, charIndex - 1);
        charIndex--;
        typingSpeed = 50;
    } else {
        typedElement.textContent = currentText.substring(0, charIndex + 1);
        charIndex++;
        typingSpeed = 100;
    }

    if (!isDeleting && charIndex === currentText.length) {
        isDeleting = true;
        typingSpeed = 2000;
    } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        textIndex = (textIndex + 1) % texts.length;
        typingSpeed = 500;
    }

    setTimeout(typeText, typingSpeed);
}

// Start typing animation
typeText();

// Smooth Scroll for Navigation Links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Enhanced notification function
function showNotification(message, type = 'success') {
    // Remove any existing notifications first
    const existingNotification = document.querySelector('.custom-notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'custom-notification';
    
    // Set icon based on type
    const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
    const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
    const borderColor = type === 'success' ? 'border-green-400' : 'border-red-400';
    
    notification.innerHTML = `
        <div class="flex items-center gap-3 ${bgColor} text-white px-6 py-4 rounded-lg shadow-2xl border-l-4 ${borderColor} min-w-[320px]">
            <i class="fas ${icon} text-2xl"></i>
            <div>
                <p class="font-semibold">${type === 'success' ? 'Success!' : 'Error!'}</p>
                <p class="text-sm">${message}</p>
            </div>
        </div>
    `;
    
    // Add to body
    document.body.appendChild(notification);
    
    // Trigger animation
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 4000);
    }, 4000);
}

// Contact Form Handler - Connected to Backend
const contactForm = document.getElementById('contactForm');

if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const message = document.getElementById('message').value;
        
        // Validate inputs
        if (!name || !email || !message) {
            showNotification('Please fill in all fields', 'error');
            return false;
        }
        
        // Disable submit button to prevent double submission
        const submitBtn = contactForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Sending...';
        
        try {
            // Send inquiry to backend
            const result = await apiCall('/inquiries', 'POST', {
                name,
                email,
                message
            });
            
            console.log('Inquiry submitted:', result);
            
            // Show success notification
            showNotification('Your message has been sent successfully! We will get back to you soon.', 'success');
            
            // Reset form
            contactForm.reset();
        } catch (error) {
            console.error('Error submitting inquiry:', error);
            showNotification('Failed to send message. Please try again later.', 'error');
        } finally {
            // Re-enable submit button
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
        
        return false;
    });
}

// Download CV Handler
const downloadCV = document.getElementById('downloadCV');

downloadCV.addEventListener('click', (e) => {
    e.preventDefault();
    showNotification('CV download will be available soon!', 'success');
});

// Load and Display Projects from Backend
async function loadProjects() {
    const projectsContainer = document.getElementById('projectsContainer');
    const projectsEmpty = document.getElementById('projectsEmpty');

    try {
        const response = await apiCall('/projects');
        const projects = response.data;
        
        if (!projects || projects.length === 0) {
            projectsContainer.classList.add('hidden');
            projectsEmpty.classList.remove('hidden');
            console.log('No projects found in backend');
            return;
        }

        // Update projects section with dynamic content
        projectsContainer.innerHTML = projects.map(project => {
            const techArray = Array.isArray(project.technologies) 
                ? project.technologies 
                : project.technologies.split(',');

            return `
                <div class="bg-slate-800 rounded-2xl overflow-hidden border border-white/10 hover:border-primary transition transform hover:-translate-y-2">
                    <div class="h-48 gradient-bg flex items-center justify-center">
                        <i class="${project.icon || 'fas fa-project-diagram'} text-7xl text-white/30"></i>
                    </div>
                    <div class="p-6">
                        <h3 class="text-2xl font-semibold mb-3">${project.name}</h3>
                        <p class="text-slate-400 text-sm mb-4">${project.description}</p>
                        <div class="flex flex-wrap gap-2 mb-4">
                            ${techArray.map(tech => 
                                `<span class="px-3 py-1 bg-primary/20 text-primary rounded-full text-xs font-medium">${tech.trim()}</span>`
                            ).join('')}
                        </div>
                        <div class="flex gap-4">
                            ${project.github ? `
                                <a href="${project.github}" target="_blank" class="text-primary hover:text-accent transition flex items-center gap-2 text-sm font-medium">
                                    <i class="fab fa-github"></i> Code
                                </a>
                            ` : ''}
                            ${project.demo ? `
                                <a href="${project.demo}" target="_blank" class="text-primary hover:text-accent transition flex items-center gap-2 text-sm font-medium">
                                    <i class="fas fa-external-link-alt"></i> Demo
                                </a>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        projectsEmpty.classList.add('hidden');
        console.log('Loaded projects:', projects);
    } catch (error) {
        console.error('Failed to load projects:', error);
        projectsContainer.innerHTML = `
            <div class="col-span-full text-center py-12">
                <i class="fas fa-exclamation-circle text-6xl text-red-500 mb-4"></i>
                <p class="text-slate-400 text-lg">Failed to load projects. Please try again later.</p>
            </div>
        `;
    }
}

// Load and Display Skills from Backend
async function loadSkills() {
    const skillsContainer = document.getElementById('skillsContainer');
    const skillsEmpty = document.getElementById('skillsEmpty');

    try {
        const response = await apiCall('/skills');
        const skills = response.data;
        
        if (!skills || skills.length === 0) {
            skillsContainer.classList.add('hidden');
            skillsEmpty.classList.remove('hidden');
            console.log('No skills found in backend');
            return;
        }

        // Update skills section with dynamic content
        skillsContainer.innerHTML = skills.map(skill => `
            <div class="bg-slate-800 p-6 rounded-2xl border border-white/10 hover:border-primary transition transform hover:-translate-y-2 flex items-center gap-4">
                <i class="${skill.icon} text-5xl text-primary"></i>
                <div>
                    <h3 class="text-xl font-semibold mb-1">${skill.name}</h3>
                    <p class="text-slate-400 text-sm">${skill.description}</p>
                </div>
            </div>
        `).join('');
        
        skillsEmpty.classList.add('hidden');
        console.log('Loaded skills:', skills);
    } catch (error) {
        console.error('Failed to load skills:', error);
        skillsContainer.innerHTML = `
            <div class="col-span-full text-center py-12">
                <i class="fas fa-exclamation-circle text-6xl text-red-500 mb-4"></i>
                <p class="text-slate-400 text-lg">Failed to load skills. Please try again later.</p>
            </div>
        `;
    }
}

// Load and Display Profile from Backend
async function loadProfile() {
    try {
        const response = await apiCall('/profile');
        const profile = response.data;
        
        if (!profile) {
            console.log('No profile found in backend');
            return;
        }

        // Update profile information dynamically
        if (profile.name) {
            const heroName = document.querySelector('.gradient-text');
            if (heroName) {
                heroName.textContent = profile.name;
            }
        }

        if (profile.bio) {
            const bioElement = document.querySelector('#home p.text-lg');
            if (bioElement) {
                bioElement.textContent = profile.bio;
            }
        }

        // Update typing animation texts if subtitles are provided
        if (profile.subtitle1 || profile.subtitle2) {
            texts.length = 0; // Clear existing texts
            if (profile.subtitle1) texts.push(profile.subtitle1);
            if (profile.subtitle2) texts.push(profile.subtitle2);
            texts.push('Problem Solver', 'Tech Enthusiast');
        }
        
        console.log('Loaded profile:', profile);
    } catch (error) {
        console.error('Failed to load profile:', error);
    }
}

// Load Social Links from Backend
async function loadSocialLinks() {
    try {
        const response = await apiCall('/social');
        const social = response.data;
        
        if (!social) {
            console.log('No social links found in backend');
            return;
        }

        // Update social links dynamically
        if (social.github) {
            const githubLinks = document.querySelectorAll('a[href*="github"]');
            githubLinks.forEach(link => link.href = social.github);
        }
        if (social.linkedin) {
            const linkedinLinks = document.querySelectorAll('a[href*="linkedin"]');
            linkedinLinks.forEach(link => link.href = social.linkedin);
        }
        if (social.twitter) {
            const twitterLinks = document.querySelectorAll('a[href*="twitter"]');
            twitterLinks.forEach(link => link.href = social.twitter);
        }
        
        console.log('Loaded social links:', social);
    } catch (error) {
        console.error('Failed to load social links:', error);
    }
}

// Scroll Animation for Cards
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe all cards
document.querySelectorAll('.bg-slate-800').forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'all 0.6s ease';
    observer.observe(card);
});

// Active Navigation Link
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('nav a[href^="#"]');

window.addEventListener('scroll', () => {
    let current = '';
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (pageYOffset >= sectionTop - 200) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('text-primary');
        link.classList.add('text-slate-400');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('text-primary');
            link.classList.remove('text-slate-400');
        }
    });
});

// Initialize - Load all data when page loads
window.addEventListener('DOMContentLoaded', async () => {
    try {
        // Show loading notification
        console.log('Loading portfolio data...');
        
        await Promise.all([
            loadProfile(),
            loadSocialLinks(),
            loadProjects(),
            loadSkills()
        ]);

        console.log('Portfolio data loaded successfully');
    } catch (error) {
        console.error('Error initializing page:', error);
        showNotification('Some content failed to load. Using default data.', 'error');
    }
});