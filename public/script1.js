        // API Base URL - Change this to your Render deployment URL
        const API_BASE_URL = 'https://habtejobportal.onrender.com/api';
        
        // DOM Elements
        const authButtons = document.getElementById('auth-buttons');
        const userMenu = document.getElementById('user-menu');
        const usernameSpan = document.getElementById('username');
        const loginForm = document.getElementById('login-form');
        const seekerRegisterForm = document.getElementById('seeker-register-form');
        const employerRegisterForm = document.getElementById('employer-register-form');
        const profileForm = document.getElementById('profile-form');
        const jobForm = document.getElementById('job-form');
        const cvForm = document.getElementById('cv-form');
        const jobsContainer = document.getElementById('jobs-container');
        const jobsLoading = document.getElementById('jobs-loading');
        const toast = document.querySelector('.toast');
        const toastMessage = document.getElementById('toast-message');
        const logoutBtn = document.getElementById('logout-btn');
        const cvModal = document.getElementById('cvModal');
        const cvModalTitle = document.getElementById('cvModalTitle');
        const cvTemplateInput = document.getElementById('cvTemplate');
        const profileUpload = document.getElementById('profile-upload');
        const uploadTrigger = document.getElementById('upload-trigger');
        const profileImage = document.getElementById('profile-image');
        const debugPanel = document.getElementById('debug-panel');
        const debugApiUrl = document.getElementById('debug-api-url');
        const debugStatus = document.getElementById('debug-status');
        const debugError = document.getElementById('debug-error');
        const retryConnection = document.getElementById('retry-connection');
        const toggleDebug = document.getElementById('toggle-debug');

        // Initialize Bootstrap toast
        const bsToast = new bootstrap.Toast(toast);

        // Show debug panel by default
        debugPanel.style.display = 'block';
        debugApiUrl.textContent = API_BASE_URL;

        // Check API connection
        async function checkApiConnection() {
            try {
                const response = await fetch(`${API_BASE_URL}/health`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                if (response.ok) {
                    debugStatus.textContent = 'Connected';
                    debugStatus.className = 'badge bg-success';
                    debugError.textContent = 'None';
                    return true;
                } else {
                    throw new Error(`HTTP ${response.status}`);
                }
            } catch (error) {
                debugStatus.textContent = 'Disconnected';
                debugStatus.className = 'badge bg-danger';
                debugError.textContent = error.message;
                return false;
            }
        }

        // Check if user is logged in
        function checkAuthStatus() {
            const token = localStorage.getItem('token');
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            
            if (token && user) {
                authButtons.style.display = 'none';
                userMenu.style.display = 'block';
                usernameSpan.textContent = user.name || user.email;
            } else {
                authButtons.style.display = 'flex';
                userMenu.style.display = 'none';
            }
        }

        // Show notification
        function showNotification(message, isError = false) {
            toastMessage.textContent = message;
            if (isError) {
                toast.classList.add('bg-danger');
                toast.classList.remove('bg-success');
            } else {
                toast.classList.add('bg-success');
                toast.classList.remove('bg-danger');
            }
            bsToast.show();
        }

        // API Request Helper
        async function apiRequest(url, options = {}) {
            const token = localStorage.getItem('token');
            
            const headers = {
                'Content-Type': 'application/json',
                ...options.headers
            };
            
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            
            try {
                // Update debug status
                debugStatus.textContent = 'Requesting...';
                debugStatus.className = 'badge bg-warning';
                
                const response = await fetch(`${API_BASE_URL}${url}`, {
                    ...options,
                    headers
                });
                
                // Check if response is OK
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`HTTP ${response.status}: ${errorText}`);
                }
                
                const data = await response.json();
                
                // Update debug status
                debugStatus.textContent = 'Connected';
                debugStatus.className = 'badge bg-success';
                debugError.textContent = 'None';
                
                return data;
            } catch (error) {
                console.error('API request error:', error);
                
                // Update debug status
                debugStatus.textContent = 'Error';
                debugStatus.className = 'badge bg-danger';
                debugError.textContent = error.message;
                
                throw error;
            }
        }

        // Load jobs from API
        async function loadJobs() {
            try {
                jobsLoading.style.display = 'block';
                const data = await apiRequest('/jobs');
                displayJobs(data.jobs || []);
                jobsLoading.style.display = 'none';
            } catch (error) {
                console.error('Failed to load jobs:', error);
                jobsLoading.innerHTML = `
                    <div class="alert alert-warning">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        Unable to load jobs. Please check your connection and try again.
                    </div>
                    <button class="btn btn-primary mt-3" onclick="loadJobs()">Retry</button>
                `;
                showNotification('Failed to load jobs. Please try again later.', true);
            }
        }

        // Display jobs in the UI
        function displayJobs(jobs) {
            if (jobs.length === 0) {
                jobsContainer.innerHTML = `
                    <div class="col-12 text-center py-5">
                        <i class="fas fa-briefcase fa-3x mb-3 text-muted"></i>
                        <h4>No jobs available at the moment</h4>
                        <p>Check back later for new opportunities</p>
                    </div>
                `;
                return;
            }
            
            jobsContainer.innerHTML = jobs.map(job => `
                <div class="col-md-6 col-lg-4 mb-4">
                    <div class="card job-card h-100">
                        <div class="card-body">
                            <div class="d-flex justify-content-between">
                                <span class="badge bg-${getJobTypeBadgeColor(job.type)}">${job.type}</span>
                                <span class="text-success">${job.salary || 'Negotiable'}</span>
                            </div>
                            <h5 class="card-title mt-3">${job.title}</h5>
                            <p class="card-text">${job.description.substring(0, 100)}...</p>
                            <div class="d-flex justify-content-between align-items-center">
                                <span><i class="fas fa-building me-2 text-muted"></i>${job.company}</span>
                                <span><i class="fas fa-map-marker-alt me-2 text-muted"></i>${job.location}</span>
                            </div>
                        </div>
                        <div class="card-footer bg-white">
                            <a href="#" class="btn btn-sm btn-outline-primary">View Details</a>
                            <small class="text-muted ms-3"><i class="far fa-clock me-1"></i>${formatDate(job.createdAt)}</small>
                        </div>
                    </div>
                </div>
            `).join('');
        }

        // Helper function to get badge color based on job type
        function getJobTypeBadgeColor(type) {
            const colors = {
                'full-time': 'success',
                'part-time': 'info',
                'contract': 'warning',
                'internship': 'primary'
            };
            return colors[type] || 'secondary';
        }

        // Format date for display
        function formatDate(dateString) {
            const date = new Date(dateString);
            const now = new Date();
            const diffTime = Math.abs(now - date);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays === 1) return 'Today';
            if (diffDays === 2) return 'Yesterday';
            if (diffDays < 7) return `${diffDays - 1} days ago`;
            if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
            
            return date.toLocaleDateString();
        }

        // Event Listeners
        document.addEventListener('DOMContentLoaded', async function() {
            // Check API connection first
            const isConnected = await checkApiConnection();
            
            if (isConnected) {
                checkAuthStatus();
                loadJobs();
            } else {
                showNotification('Cannot connect to server. Please check your connection.', true);
            }
            
            // Update active nav link on scroll
            const sections = document.querySelectorAll('section');
            const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
            
            window.addEventListener('scroll', function() {
                let current = '';
                sections.forEach(section => {
                    const sectionTop = section.offsetTop;
                    const sectionHeight = section.clientHeight;
                    if (pageYOffset >= (sectionTop - 100)) {
                        current = section.getAttribute('id');
                    }
                });
                
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href').substring(1) === current) {
                        link.classList.add('active');
                    }
                });
            });
            
            // Smooth scrolling for anchor links
            document.querySelectorAll('a[href^="#"]').forEach(anchor => {
                anchor.addEventListener('click', function (e) {
                    e.preventDefault();
                    const targetId = this.getAttribute('href');
                    if (targetId === '#') return;
                    
                    const targetElement = document.querySelector(targetId);
                    if (targetElement) {
                        window.scrollTo({
                            top: targetElement.offsetTop - 70,
                            behavior: 'smooth'
                        });
                    }
                });
            });
        });

        // Debug panel functionality
        retryConnection.addEventListener('click', async function() {
            const isConnected = await checkApiConnection();
            if (isConnected) {
                showNotification('Connection restored!');
                loadJobs();
            } else {
                showNotification('Still unable to connect to server.', true);
            }
        });

        toggleDebug.addEventListener('click', function() {
            if (debugPanel.style.display === 'block') {
                debugPanel.style.display = 'none';
                toggleDebug.textContent = 'Show Debug';
            } else {
                debugPanel.style.display = 'block';
                toggleDebug.textContent = 'Hide';
            }
        });

        // Login form submission
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            
            try {
                const data = await apiRequest('/auth/login', {
                    method: 'POST',
                    body: JSON.stringify({ email, password })
                });
                
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                
                showNotification('Login successful!');
                checkAuthStatus();
                
                // Close the modal
                const loginModal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
                loginModal.hide();
                
                // Reset form
                loginForm.reset();
            } catch (error) {
                showNotification(error.message || 'Login failed. Please try again.', true);
            }
        });

        // Job Seeker Registration
        seekerRegisterForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const name = document.getElementById('seekerName').value;
            const email = document.getElementById('seekerEmail').value;
            const password = document.getElementById('seekerPassword').value;
            
            try {
                const data = await apiRequest('/auth/register', {
                    method: 'POST',
                    body: JSON.stringify({ 
                        name, 
                        email, 
                        password, 
                        role: 'jobseeker' 
                    })
                });
                
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                
                showNotification('Registration successful!');
                checkAuthStatus();
                
                // Close the modal
                const registerModal = bootstrap.Modal.getInstance(document.getElementById('registerModal'));
                registerModal.hide();
                
                // Reset form
                seekerRegisterForm.reset();
            } catch (error) {
                showNotification(error.message || 'Registration failed. Please try again.', true);
            }
        });

        // Employer Registration
        employerRegisterForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const company = document.getElementById('employerCompanyName').value;
            const email = document.getElementById('employerEmail').value;
            const password = document.getElementById('employerPassword').value;
            
            try {
                const data = await apiRequest('/auth/register', {
                    method: 'POST',
                    body: JSON.stringify({ 
                        name: company, 
                        email, 
                        password, 
                        role: 'employer',
                        company 
                    })
                });
                
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                
                showNotification('Registration successful!');
                checkAuthStatus();
                
                // Close the modal
                const registerModal = bootstrap.Modal.getInstance(document.getElementById('registerModal'));
                registerModal.hide();
                
                // Reset form
                employerRegisterForm.reset();
            } catch (error) {
                showNotification(error.message || 'Registration failed. Please try again.', true);
            }
        });

        // Profile form submission
        profileForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const name = document.getElementById('profileName').value;
            const email = document.getElementById('profileEmail').value;
            const phone = document.getElementById('profilePhone').value;
            const location = document.getElementById('profileLocation').value;
            const bio = document.getElementById('profileBio').value;
            const skills = document.getElementById('profileSkills').value;
            
            try {
                await apiRequest('/profile', {
                    method: 'PUT',
                    body: JSON.stringify({ 
                        name, 
                        email, 
                        phone, 
                        location, 
                        bio, 
                        skills 
                    })
                });
                
                // Update local user data
                const user = JSON.parse(localStorage.getItem('user') || '{}');
                user.name = name;
                user.email = email;
                localStorage.setItem('user', JSON.stringify(user));
                
                usernameSpan.textContent = name;
                
                showNotification('Profile updated successfully!');
                
                // Close the modal
                const profileModal = bootstrap.Modal.getInstance(document.getElementById('profileModal'));
                profileModal.hide();
            } catch (error) {
                showNotification(error.message || 'Failed to update profile. Please try again.', true);
            }
        });

        // Job posting form submission
        jobForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const title = document.getElementById('jobTitle').value;
            const company = document.getElementById('companyName').value;
            const type = document.getElementById('jobType').value;
            const salary = document.getElementById('salaryRange').value;
            const description = document.getElementById('jobDescription').value;
            const location = document.getElementById('location').value;
            const applicationEmail = document.getElementById('applicationEmail').value;
            const postToTelegram = document.getElementById('telegramPost').checked;
            
            try {
                await apiRequest('/jobs', {
                    method: 'POST',
                    body: JSON.stringify({ 
                        title, 
                        company, 
                        type, 
                        salary, 
                        description, 
                        location, 
                        applicationEmail,
                        postToTelegram
                    })
                });
                
                showNotification('Job posted successfully!');
                jobForm.reset();
                
                // Reload jobs
                loadJobs();
            } catch (error) {
                showNotification(error.message || 'Failed to post job. Please try again.', true);
            }
        });

        // CV form submission
        cvForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const fullName = document.getElementById('cvFullName').value;
            const jobTitle = document.getElementById('cvJobTitle').value;
            const email = document.getElementById('cvEmail').value;
            const phone = document.getElementById('cvPhone').value;
            const summary = document.getElementById('cvSummary').value;
            const experience = document.getElementById('cvExperience').value;
            const education = document.getElementById('cvEducation').value;
            const skills = document.getElementById('cvSkills').value;
            const template = cvTemplateInput.value;
            
            try {
                const data = await apiRequest('/cv', {
                    method: 'POST',
                    body: JSON.stringify({ 
                        fullName, 
                        jobTitle, 
                        email, 
                        phone, 
                        summary, 
                        experience, 
                        education, 
                        skills, 
                        template
                    })
                });
                
                showNotification('CV created successfully!');
                
                // Close the modal
                const cvModalInstance = bootstrap.Modal.getInstance(document.getElementById('cvModal'));
                cvModalInstance.hide();
                
                // Show shareable link
                showNotification(`Your CV is available at: ${data.shareableLink}`);
            } catch (error) {
                showNotification(error.message || 'Failed to create CV. Please try again.', true);
            }
        });

        // Logout functionality
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            checkAuthStatus();
            showNotification('You have been logged out.');
        });

        // CV template selection
        document.querySelectorAll('[data-bs-target="#cvModal"]').forEach(button => {
            button.addEventListener('click', function() {
                const template = this.getAttribute('data-template');
                cvTemplateInput.value = template;
                cvModalTitle.textContent = `Create Your CV - ${template.charAt(0).toUpperCase() + template.slice(1)} Template`;
            });
        });

        // Profile image upload
        uploadTrigger.addEventListener('click', function() {
            profileUpload.click();
        });

        profileUpload.addEventListener('change', function() {
            if (this.files && this.files[0]) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    profileImage.src = e.target.result;
                    // In a real app, you would upload this to your server
                };
                reader.readAsDataURL(this.files[0]);
            }
        });

        // Load profile data when modal is shown
        document.getElementById('profileModal').addEventListener('show.bs.modal', function() {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const profile = JSON.parse(localStorage.getItem('profile') || '{}');
            
            document.getElementById('profileName').value = user.name || '';
            document.getElementById('profileEmail').value = user.email || '';
            document.getElementById('profilePhone').value = profile.phone || '';
            document.getElementById('profileLocation').value = profile.location || '';
            document.getElementById('profileBio').value = profile.bio || '';
            document.getElementById('profileSkills').value = profile.skills || '';
        });

        // Load user data for CV form when modal is shown
        document.getElementById('cvModal').addEventListener('show.bs.modal', function() {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const profile = JSON.parse(localStorage.getItem('profile') || '{}');
            
            if (user.name) document.getElementById('cvFullName').value = user.name;
            if (profile.title) document.getElementById('cvJobTitle').value = profile.title;
            if (user.email) document.getElementById('cvEmail').value = user.email;
            if (profile.phone) document.getElementById('cvPhone').value = profile.phone;
            if (profile.bio) document.getElementById('cvSummary').value = profile.bio;
            if (profile.skills) document.getElementById('cvSkills').value = profile.skills;
        });
