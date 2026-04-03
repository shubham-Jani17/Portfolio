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

    const token = localStorage.getItem('adminToken');
    if (token) {
        options.headers['Authorization'] = `Bearer ${token}`;
    }

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
        showAlert(error.message || 'An error occurred', 'error');
        throw error;
    }
}

const DataStore = {
    projects: [],
    skills: [],
    inquiries: [],
    profile: {},
    social: {},

    async init() {
        await this.loadAllData();
        this.updateAllStats();
    },

    async loadAllData() {
        try {
            // Load all data from backend
            const [projects, skills, inquiries, profile, social] = await Promise.all([
                apiCall('/projects'),
                apiCall('/skills'),
                apiCall('/inquiries'),
                apiCall('/profile'),
                apiCall('/social')
            ]);

            this.projects = projects.data || [];
            this.skills = skills.data || [];
            this.inquiries = inquiries.data || [];
            this.profile = profile.data || {};
            this.social = social.data || {};
        } catch (error) {
            console.error('Error loading data:', error);
            showAlert('Failed to load data from server', 'error');
        }
    },

    updateAllStats() {
        document.getElementById('totalProjects').textContent = this.projects.length;
        document.getElementById('totalSkills').textContent = this.skills.length;
        document.getElementById('totalInquiries').textContent = this.inquiries.length;

        const unread = this.inquiries.filter(i => i.status === 'unread').length;
        document.getElementById('unreadCount').innerHTML =
            `<i class="fas fa-clock"></i> ${unread} unread`;
    },

    async addProject(project) {
        try {
            const result = await apiCall('/projects', 'POST', project);
            this.projects.push(result.data);
            this.updateAllStats();
            renderProjects();
            return result;
        } catch (error) {
            throw error;
        }
    },

    async updateProject(id, project) {
        try {
            const result = await apiCall(`/projects/${id}`, 'PUT', project);
            const index = this.projects.findIndex(p => p.id === id);
            if (index !== -1) {
                this.projects[index] = result.data;
            }
            renderProjects();
            return result;
        } catch (error) {
            throw error;
        }
    },

    async deleteProject(id) {
        try {
            await apiCall(`/projects/${id}`, 'DELETE');
            this.projects = this.projects.filter(p => p.id !== id);
            this.updateAllStats();
            renderProjects();
        } catch (error) {
            throw error;
        }
    },

    async addSkill(skill) {
        try {
            const result = await apiCall('/skills', 'POST', skill);
            this.skills.push(result.data);
            this.updateAllStats();
            renderSkills();
            return result;
        } catch (error) {
            throw error;
        }
    },

    async updateSkill(id, skill) {
        try {
            const result = await apiCall(`/skills/${id}`, 'PUT', skill);
            const index = this.skills.findIndex(s => s.id === id);
            if (index !== -1) {
                this.skills[index] = result.data;
            }
            renderSkills();
            return result;
        } catch (error) {
            throw error;
        }
    },

    async deleteSkill(id) {
        try {
            await apiCall(`/skills/${id}`, 'DELETE');
            this.skills = this.skills.filter(s => s.id !== id);
            this.updateAllStats();
            renderSkills();
        } catch (error) {
            throw error;
        }
    },

    async updateInquiryStatus(id, status) {
        try {
            await apiCall(`/inquiries/${id}/status`, 'PUT', { status });
            const inquiry = this.inquiries.find(i => i.id === id);
            if (inquiry) {
                inquiry.status = status;
            }
            this.updateAllStats();
            renderInquiries();
        } catch (error) {
            throw error;
        }
    },

    async deleteInquiry(id) {
        try {
            await apiCall(`/inquiries/${id}`, 'DELETE');
            this.inquiries = this.inquiries.filter(i => i.id !== id);
            this.updateAllStats();
            renderInquiries();
        } catch (error) {
            throw error;
        }
    },

    async updateProfile(profileData) {
        try {
            const result = await apiCall('/profile', 'PUT', profileData);
            this.profile = result.data;
            return result;
        } catch (error) {
            throw error;
        }
    },

    async updateSocial(socialData) {
        try {
            const result = await apiCall('/social', 'PUT', socialData);
            this.social = result.data;
            return result;
        } catch (error) {
            throw error;
        }
    }
};

let currentEditIndex = -1;
let currentEditId = null;

// Mobile Navigation
const menuToggle = document.getElementById('menuToggle');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');

menuToggle.addEventListener('click', () => {
    sidebar.classList.toggle('-translate-x-full');
    overlay.classList.toggle('hidden');
});

overlay.addEventListener('click', () => {
    sidebar.classList.add('-translate-x-full');
    overlay.classList.add('hidden');
});

// Section Navigation
document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const section = item.dataset.section;
        showSection(section);

        document.querySelectorAll('.menu-item').forEach(mi => mi.classList.remove('active', 'bg-slate-800', 'text-primary'));
        item.classList.add('active', 'bg-slate-800', 'text-primary');

        if (window.innerWidth < 1024) {
            sidebar.classList.add('-translate-x-full');
            overlay.classList.add('hidden');
        }
    });
});

function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(section => {
        section.classList.add('hidden');
    });
    document.getElementById(sectionId).classList.remove('hidden');

    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active', 'bg-slate-800', 'text-primary');
        if (item.dataset.section === sectionId) {
            item.classList.add('active', 'bg-slate-800', 'text-primary');
        }
    });
}

// Projects Management
function renderProjects() {
    const tbody = document.getElementById('projectsTableBody');
    if (DataStore.projects.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="p-4 text-center text-gray-400">No projects yet. Add your first project!</td></tr>';
        return;
    }

    tbody.innerHTML = DataStore.projects.map((project) => `
        <tr class="border-b border-slate-700 hover:bg-slate-700/30">
            <td class="p-4">${project.name}</td>
            <td class="p-4">
                ${(Array.isArray(project.technologies) ? project.technologies : project.technologies.split(',')).map(tech =>
        `<span class="inline-block px-3 py-1 text-xs font-semibold text-green-400 bg-green-400/20 rounded-full mr-1 mb-1">${tech.trim()}</span>`
    ).join('')}
            </td>
            <td class="p-4">
                <span class="inline-block px-3 py-1 text-xs font-semibold rounded-full ${project.status === 'active' ? 'text-green-400 bg-green-400/20' : 'text-yellow-400 bg-yellow-400/20'
        }">${project.status}</span>
            </td>
            <td class="p-4">
                <div class="flex gap-2">
                    <button onclick="editProject(${project.id})" class="w-8 h-8 flex items-center justify-center bg-darker border border-slate-700 rounded text-gray-400 hover:bg-primary hover:text-white hover:border-primary transition">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteProject(${project.id})" class="w-8 h-8 flex items-center justify-center bg-darker border border-slate-700 rounded text-gray-400 hover:bg-red-500 hover:text-white hover:border-red-500 transition">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function openProjectModal() {
    currentEditId = null;
    document.getElementById('projectModalTitle').textContent = 'Add New Project';
    document.getElementById('projectForm').reset();
    document.getElementById('projectModal').classList.remove('hidden');
    document.getElementById('projectModal').classList.add('flex');
}

function editProject(id) {
    currentEditId = id;
    const project = DataStore.projects.find(p => p.id === id);
    if (!project) return;

    document.getElementById('projectModalTitle').textContent = 'Edit Project';
    document.getElementById('projectName').value = project.name;
    document.getElementById('projectDescription').value = project.description;
    document.getElementById('projectIcon').value = project.icon || '';
    document.getElementById('projectStatus').value = project.status;

    const techArray = Array.isArray(project.technologies) ? project.technologies : project.technologies.split(',');
    document.getElementById('projectTech').value = techArray.join(', ');
    document.getElementById('projectGithub').value = project.github || '';
    document.getElementById('projectDemo').value = project.demo || '';

    document.getElementById('projectModal').classList.remove('hidden');
    document.getElementById('projectModal').classList.add('flex');
}

async function deleteProject(id) {
    if (confirm('Are you sure you want to delete this project?')) {
        try {
            await DataStore.deleteProject(id);
            showAlert('Project deleted successfully!', 'success');
        } catch (error) {
            showAlert('Failed to delete project', 'error');
        }
    }
}

document.getElementById('projectForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const projectData = {
        name: document.getElementById('projectName').value,
        description: document.getElementById('projectDescription').value,
        icon: document.getElementById('projectIcon').value || 'fas fa-project-diagram',
        technologies: document.getElementById('projectTech').value,
        github: document.getElementById('projectGithub').value,
        demo: document.getElementById('projectDemo').value,
        status: document.getElementById('projectStatus').value
    };

    try {
        if (currentEditId) {
            await DataStore.updateProject(currentEditId, projectData);
            showAlert('Project updated successfully!', 'success');
        } else {
            await DataStore.addProject(projectData);
            showAlert('Project added successfully!', 'success');
        }
        closeModal('projectModal');
    } catch (error) {
        showAlert('Failed to save project', 'error');
    }
});

// Skills Management
function renderSkills() {
    const tbody = document.getElementById('skillsTableBody');
    if (DataStore.skills.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="p-4 text-center text-gray-400">No skills yet. Add your first skill!</td></tr>';
        return;
    }

    tbody.innerHTML = DataStore.skills.map((skill) => `
        <tr class="border-b border-slate-700 hover:bg-slate-700/30">
            <td class="p-4">${skill.name}</td>
            <td class="p-4">${skill.description}</td>
            <td class="p-4"><i class="${skill.icon} text-primary text-2xl"></i></td>
            <td class="p-4">
                <div class="flex gap-2">
                    <button onclick="editSkill(${skill.id})" class="w-8 h-8 flex items-center justify-center bg-darker border border-slate-700 rounded text-gray-400 hover:bg-primary hover:text-white hover:border-primary transition">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteSkill(${skill.id})" class="w-8 h-8 flex items-center justify-center bg-darker border border-slate-700 rounded text-gray-400 hover:bg-red-500 hover:text-white hover:border-red-500 transition">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function openSkillModal() {
    currentEditId = null;
    document.getElementById('skillModalTitle').textContent = 'Add New Skill';
    document.getElementById('skillForm').reset();
    document.getElementById('skillModal').classList.remove('hidden');
    document.getElementById('skillModal').classList.add('flex');
}

function editSkill(id) {
    currentEditId = id;
    const skill = DataStore.skills.find(s => s.id === id);
    if (!skill) return;

    document.getElementById('skillModalTitle').textContent = 'Edit Skill';
    document.getElementById('skillName').value = skill.name;
    document.getElementById('skillDescription').value = skill.description;
    document.getElementById('skillIcon').value = skill.icon;

    document.getElementById('skillModal').classList.remove('hidden');
    document.getElementById('skillModal').classList.add('flex');
}

async function deleteSkill(id) {
    if (confirm('Are you sure you want to delete this skill?')) {
        try {
            await DataStore.deleteSkill(id);
            showAlert('Skill deleted successfully!', 'success');
        } catch (error) {
            showAlert('Failed to delete skill', 'error');
        }
    }
}

document.getElementById('skillForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const skillData = {
        name: document.getElementById('skillName').value,
        description: document.getElementById('skillDescription').value,
        icon: document.getElementById('skillIcon').value
    };

    try {
        if (currentEditId) {
            await DataStore.updateSkill(currentEditId, skillData);
            showAlert('Skill updated successfully!', 'success');
        } else {
            await DataStore.addSkill(skillData);
            showAlert('Skill added successfully!', 'success');
        }
        closeModal('skillModal');
    } catch (error) {
        showAlert('Failed to save skill', 'error');
    }
});

// Inquiries Management
function renderInquiries() {
    const tbody = document.getElementById('inquiriesTableBody');
    if (DataStore.inquiries.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="p-4 text-center text-gray-400">No inquiries yet.</td></tr>';
        return;
    }

    tbody.innerHTML = DataStore.inquiries.map((inquiry) => `
        <tr class="border-b border-slate-700 hover:bg-slate-700/30">
            <td class="p-4">${inquiry.name}</td>
            <td class="p-4">${inquiry.email}</td>
            <td class="p-4">${inquiry.message.substring(0, 30)}...</td>
            <td class="p-4">${new Date(inquiry.date).toLocaleDateString()}</td>
            <td class="p-4">
                <span class="inline-block px-3 py-1 text-xs font-semibold rounded-full ${inquiry.status === 'read' ? 'text-green-400 bg-green-400/20' : 'text-yellow-400 bg-yellow-400/20'
        }">${inquiry.status}</span>
            </td>
            <td class="p-4">
                <div class="flex gap-2">
                    <button onclick="viewInquiry(${inquiry.id})" class="w-8 h-8 flex items-center justify-center bg-darker border border-slate-700 rounded text-gray-400 hover:bg-primary hover:text-white hover:border-primary transition">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button onclick="deleteInquiry(${inquiry.id})" class="w-8 h-8 flex items-center justify-center bg-darker border border-slate-700 rounded text-gray-400 hover:bg-red-500 hover:text-white hover:border-red-500 transition">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function viewInquiry(id) {
    currentEditId = id;
    const inquiry = DataStore.inquiries.find(i => i.id === id);
    if (!inquiry) return;

    document.getElementById('inquiryName').value = inquiry.name;
    document.getElementById('inquiryEmail').value = inquiry.email;
    document.getElementById('inquiryMessage').value = inquiry.message;
    document.getElementById('inquiryDate').value = new Date(inquiry.date).toLocaleString();

    document.getElementById('inquiryModal').classList.remove('hidden');
    document.getElementById('inquiryModal').classList.add('flex');
}

async function markAsRead() {
    if (currentEditId) {
        try {
            await DataStore.updateInquiryStatus(currentEditId, 'read');
            closeModal('inquiryModal');
            showAlert('Inquiry marked as read!', 'success');
        } catch (error) {
            showAlert('Failed to update inquiry', 'error');
        }
    }
}

async function markAllRead() {
    try {
        const promises = DataStore.inquiries
            .filter(i => i.status === 'unread')
            .map(i => DataStore.updateInquiryStatus(i.id, 'read'));

        await Promise.all(promises);
        showAlert('All inquiries marked as read!', 'success');
    } catch (error) {
        showAlert('Failed to mark all as read', 'error');
    }
}

async function deleteInquiry(id) {
    if (confirm('Are you sure you want to delete this inquiry?')) {
        try {
            await DataStore.deleteInquiry(id);
            showAlert('Inquiry deleted successfully!', 'success');
        } catch (error) {
            showAlert('Failed to delete inquiry', 'error');
        }
    }
}

// Profile and Social Forms
document.getElementById('profileForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const profileData = {
        name: document.getElementById('profileName').value,
        email: document.getElementById('profileEmail').value,
        bio: document.getElementById('profileBio').value,
        subtitle1: document.getElementById('profileSubtitle1').value,
        subtitle2: document.getElementById('profileSubtitle2').value
    };

    try {
        await DataStore.updateProfile(profileData);
        showAlert('Profile updated successfully!', 'success');
    } catch (error) {
        showAlert('Failed to update profile', 'error');
    }
});

document.getElementById('socialForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const socialData = {
        github: document.getElementById('socialGithub').value,
        linkedin: document.getElementById('socialLinkedin').value,
        twitter: document.getElementById('socialTwitter').value,
        portfolio: document.getElementById('socialPortfolio').value
    };

    try {
        await DataStore.updateSocial(socialData);
        showAlert('Social links updated successfully!', 'success');
    } catch (error) {
        showAlert('Failed to update social links', 'error');
    }
});

// Modal Functions
function closeModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
    document.getElementById(modalId).classList.remove('flex');
}

document.querySelectorAll('.fixed.inset-0').forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }
    });
});

// Alert System
function showAlert(message, type = 'success') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `fixed top-5 right-5 z-50 px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 animate-slideIn ${type === 'success' ? 'bg-green-500/20 border border-green-500 text-green-400' : 'bg-red-500/20 border border-red-500 text-red-400'
        }`;
    alertDiv.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${message}</span>
    `;

    document.body.appendChild(alertDiv);

    setTimeout(() => {
        alertDiv.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(() => alertDiv.remove(), 300);
    }, 3000);
}

// Initialize Application
window.addEventListener('DOMContentLoaded', async () => {
    await DataStore.init();
    renderProjects();
    renderSkills();
    renderInquiries();
});
