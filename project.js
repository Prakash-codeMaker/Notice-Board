const STORAGE_KEY = 'college_notices_v2';  // Version-tagged storage key
const NOTICES_PER_PAGE = 8;
const MAX_NOTICES = 100;

// Application state
let notices = [];
let currentPage = 1;
let currentSort = 'newest';
let searchTerm = '';
let editingNoticeId = null;
let darkMode = localStorage.getItem('darkMode') === 'true' || false; // Default to false if not set
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
let currentCategory = '';

// Admin credentials (in a real app, this would be stored securely on the server)
const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'admin123' // In production, use proper password hashing
};

// DOM Elements
const noticeForm = document.getElementById('noticeForm');
const formTitle = document.getElementById('formTitle');
const saveNoticeBtn = document.getElementById('saveNoticeBtn');
const titleInput = document.getElementById('title');
const messageInput = document.getElementById('message');
const imageInput = document.getElementById('imageUpload');
const imagePreview = document.getElementById('imagePreview');
const noticesContainer = document.getElementById('notices');
const paginationContainer = document.getElementById('pagination');
const searchInput = document.getElementById('searchInput');
const sortOption = document.getElementById('sortOption');
const themeToggle = document.getElementById('themeToggle');
const addNewBtn = document.getElementById('addNewBtn');
const cancelBtn = document.getElementById('cancelBtn');
const noticeCount = document.getElementById('noticeCount');
const noticeModal = document.getElementById('noticeModal');
const modalClose = document.getElementById('modalClose');
const modalContent = document.getElementById('modalContent');
const removeImageBtn = document.getElementById('removeImageBtn');
const loginFormContainer = document.getElementById('loginFormContainer');
const loginForm = document.querySelector('.login-form');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const submitLoginBtn = document.getElementById('submitLoginBtn');
const cancelLoginBtn = document.getElementById('cancelLoginBtn');
const closeLoginBtn = document.getElementById('closeLoginBtn');
const userControls = document.getElementById('userControls');
const userName = document.getElementById('userName');
const categoryInput = document.getElementById('category');
const categoryFilter = document.getElementById('categoryFilter');

/**
 * Initialize the application
 */
function init() {
  try {
    // Load notices from localStorage
    loadNotices();
    
    // Setup event listeners
    setupEventListeners();
    
    // Check authentication
    checkAuth();
    
    // Apply saved theme
    updateTheme();
    
    // Initial rendering
    updateNoticesView();
    
    // Hide the form initially
    noticeForm.style.display = 'none';
    
    // Update notice count
    updateNoticeCount();
  } catch (error) {
    console.error('Error initializing application:', error);
    showToast('Error initializing application. Please refresh the page.', 'error');
  }
}

/**
 * Sets up all event listeners for the application
 */
function setupEventListeners() {
  try {
    // Authentication
    loginBtn.addEventListener('click', showLoginForm);
    logoutBtn.addEventListener('click', logout);
    submitLoginBtn.addEventListener('click', handleLogin);
    cancelLoginBtn.addEventListener('click', hideLoginForm);
    closeLoginBtn.addEventListener('click', hideLoginForm);
    
    // Form submission
    saveNoticeBtn.addEventListener('click', saveNotice);
    
    // Search and filters
    searchInput.addEventListener('input', handleSearch);
    sortOption.addEventListener('change', handleSortChange);
    categoryFilter.addEventListener('change', handleCategoryFilter);
    
    // Theme toggle
    themeToggle.addEventListener('click', toggleTheme);
    
    // Add new notice button
    addNewBtn.addEventListener('click', showAddNoticeForm);
    
    // Cancel button
    cancelBtn.addEventListener('click', hideNoticeForm);
    
    // Close form button
    const closeFormBtn = document.getElementById('closeFormBtn');
    if (closeFormBtn) {
      closeFormBtn.addEventListener('click', hideNoticeForm);
    }
    
    // Image upload
    imageInput.addEventListener('change', handleImageUpload);
    
    // Remove image button
    removeImageBtn.addEventListener('click', removeImage);
    
    // Modal close
    modalClose.addEventListener('click', closeModal);
    
    // Click outside modal to close
    window.addEventListener('click', (e) => {
      if (e.target === noticeModal) {
        closeModal();
      }
    });
    
    // Escape key to close modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeModal();
      }
    });
  } catch (error) {
    console.error('Error setting up event listeners:', error);
    showToast('Error setting up application controls. Please refresh the page.', 'error');
  }
}

/**
 * Loads notices from localStorage
 */
function loadNotices() {
  try {
    const storedNotices = localStorage.getItem(STORAGE_KEY);
    notices = storedNotices ? JSON.parse(storedNotices) : [];
    
    // Data validation - ensure all notices have required properties
    notices = notices.filter(notice => {
      return notice && 
             notice.id && 
             notice.title && 
             notice.message && 
             notice.category && 
             notice.date;
    });
    
    // Limit to MAX_NOTICES
    if (notices.length > MAX_NOTICES) {
      notices = notices.slice(0, MAX_NOTICES);
      saveNotices(); // Save the trimmed list
    }
  } catch (error) {
    console.error('Error loading notices:', error);
    notices = [];
    showToast('Error loading notices. Starting with empty notice board.', 'error');
  }
}

/**
 * Saves notices to localStorage
 */
function saveNotices() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notices));
    updateNoticeCount();
  } catch (error) {
    console.error('Error saving notices:', error);
    showToast('Failed to save notices. Local storage may be full or unavailable.', 'error');
  }
}

/**
 * Updates the notice count display
 */
function updateNoticeCount() {
  try {
    noticeCount.textContent = `${notices.length}/${MAX_NOTICES} notices`;
  } catch (error) {
    console.error('Error updating notice count:', error);
  }
}

/**
 * Shows the login form
 */
function showLoginForm() {
  try {
    loginFormContainer.style.display = 'flex';
    usernameInput.focus();
  } catch (error) {
    console.error('Error showing login form:', error);
    showToast('Error showing login form. Please try again.', 'error');
  }
}

/**
 * Hides the login form
 */
function hideLoginForm() {
  try {
    loginFormContainer.style.display = 'none';
    usernameInput.value = '';
    passwordInput.value = '';
  } catch (error) {
    console.error('Error hiding login form:', error);
  }
}

/**
 * Handles login submission
 */
function handleLogin() {
  try {
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    
    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
      currentUser = { username, role: 'admin' };
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
      checkAuth();
      hideLoginForm();
      showToast('Login successful!', 'success');
    } else {
      showToast('Invalid credentials!', 'error');
    }
  } catch (error) {
    console.error('Error handling login:', error);
    showToast('Error during login. Please try again.', 'error');
  }
}

/**
 * Handles logout
 */
function logout() {
  try {
    currentUser = null;
    localStorage.removeItem('currentUser');
    checkAuth();
    showToast('Logged out successfully!', 'success');
  } catch (error) {
    console.error('Error during logout:', error);
    showToast('Error during logout. Please try again.', 'error');
  }
}

/**
 * Checks authentication status and updates UI
 */
function checkAuth() {
  try {
    if (currentUser) {
      loginBtn.style.display = 'none';
      userControls.style.display = 'flex';
      userName.textContent = currentUser.username;
      addNewBtn.style.display = 'block';
    } else {
      loginBtn.style.display = 'block';
      userControls.style.display = 'none';
      addNewBtn.style.display = 'none';
    }
  } catch (error) {
    console.error('Error checking authentication:', error);
  }
}

/**
 * Shows a toast notification
 * @param {string} message - Message to display
 * @param {string} type - Type of notification ('success' or 'error')
 */
function showToast(message, type) {
  try {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
      <span>${message}</span>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
    }, 3000);
  } catch (error) {
    console.error('Error showing toast:', error);
  }
}

/**
 * Shows the form for adding a new notice
 */
function showAddNoticeForm() {
  try {
    if (!isAuthorized()) {
      showToast('Please login to add notices', 'error');
      return;
    }

    if (notices.length >= MAX_NOTICES) {
      showToast(`You've reached the maximum limit of ${MAX_NOTICES} notices. Please delete some notices before adding new ones.`, 'error');
      return;
    }

    formTitle.textContent = 'Add New Notice';
    saveNoticeBtn.textContent = 'Add Notice';
    titleInput.value = '';
    messageInput.value = '';
    categoryInput.value = '';
    editingNoticeId = null;

    // Show the form container and form
    const formContainer = document.getElementById('noticeFormContainer');
    formContainer.style.display = 'flex';
    noticeForm.style.display = 'block';

    // Reset image preview
    imagePreview.style.display = 'none';
    imagePreview.src = '';
    removeImageBtn.style.display = 'none';

    // Add form validation feedback
    titleInput.addEventListener('input', validateForm);
    messageInput.addEventListener('input', validateForm);
    categoryInput.addEventListener('change', validateForm);

    // Scroll to form with smooth animation
    formContainer.scrollIntoView({ behavior: 'smooth' });

    // Show success toast when form is ready
    showToast('You can now add a new notice', 'success');
  } catch (error) {
    console.error('Error showing add notice form:', error);
    showToast('Error showing add notice form. Please try again.', 'error');
  }
}

/**
 * Shows the form for editing an existing notice
 * @param {string} id - The ID of the notice to edit
 */
function showEditNoticeForm(id) {
  try {
    if (!isAuthorized()) {
      showToast('Please login to edit notices', 'error');
      return;
    }
    
    const notice = notices.find(n => n.id === id);
    if (!notice) {
      showToast('Notice not found', 'error');
      return;
    }
    
    formTitle.textContent = 'Edit Notice';
    saveNoticeBtn.textContent = 'Update Notice';
    titleInput.value = notice.title;
    messageInput.value = notice.message;
    categoryInput.value = notice.category;
    editingNoticeId = id;
    
    // Show the form container and form
    const formContainer = document.getElementById('noticeFormContainer');
    formContainer.style.display = 'flex';
    noticeForm.style.display = 'block';
    
    // Handle image
    if (notice.image) {
      imagePreview.src = notice.image;
      imagePreview.style.display = 'block';
      removeImageBtn.style.display = 'block';
      imagePreview.style.animation = 'scaleIn 0.3s ease-out';
    } else {
      imagePreview.style.display = 'none';
      removeImageBtn.style.display = 'none';
    }
    
    // Add form validation feedback
    titleInput.addEventListener('input', validateForm);
    messageInput.addEventListener('input', validateForm);
    categoryInput.addEventListener('change', validateForm);
    
    // Scroll to form with smooth animation
    formContainer.scrollIntoView({ behavior: 'smooth' });
    
    // Show success toast when form is ready
    showToast('You can now edit the notice', 'success');
  } catch (error) {
    console.error('Error showing edit notice form:', error);
    showToast('Error showing edit notice form. Please try again.', 'error');
  }
}

/**
 * Validates the form and updates the save button state
 */
function validateForm() {
  try {
    const title = titleInput.value.trim();
    const message = messageInput.value.trim();
    const category = categoryInput.value;
    const isValid = title && message && category;
    
    saveNoticeBtn.disabled = !isValid;
    saveNoticeBtn.style.opacity = isValid ? '1' : '0.7';
    
    if (!title) {
      titleInput.classList.add('invalid');
    } else {
      titleInput.classList.remove('invalid');
    }
    
    if (!message) {
      messageInput.classList.add('invalid');
    } else {
      messageInput.classList.remove('invalid');
    }
    
    if (!category) {
      categoryInput.classList.add('invalid');
    } else {
      categoryInput.classList.remove('invalid');
    }
  } catch (error) {
    console.error('Error validating form:', error);
  }
}

/**
 * Hides the notice form
 */
function hideNoticeForm() {
  try {
    const formContainer = document.getElementById('noticeFormContainer');
    formContainer.style.display = 'none';
    noticeForm.style.display = 'none';
  } catch (error) {
    console.error('Error hiding notice form:', error);
  }
}

/**
 * Handles image upload
 */
function handleImageUpload(e) {
  try {
    const file = e.target.files[0];
    if (!file) return;
    
    // Check file type
    if (!file.type.match('image.*')) {
      showToast('Please select an image file', 'error');
      return;
    }
    
    // Check file size (limit to 1MB)
    if (file.size > 1024 * 1024) {
      showToast('Image size should be less than 1MB', 'error');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      imagePreview.src = e.target.result;
      imagePreview.style.display = 'block';
      imagePreview.style.animation = 'scaleIn 0.3s ease-out';
      removeImageBtn.style.display = 'block';
      showToast('Image uploaded successfully', 'success');
    };
    reader.readAsDataURL(file);
  } catch (error) {
    console.error('Error handling image upload:', error);
    showToast('Error uploading image. Please try again.', 'error');
  }
}

/**
 * Removes the image from preview
 */
function removeImage() {
  try {
    imagePreview.src = '';
    imagePreview.style.display = 'none';
    imageInput.value = '';
    removeImageBtn.style.display = 'none';
  } catch (error) {
    console.error('Error removing image:', error);
  }
}

/**
 * Saves or updates a notice
 */
function saveNotice() {
  try {
    const title = titleInput.value.trim();
    const message = messageInput.value.trim();
    const category = categoryInput.value;
    const image = imagePreview.style.display !== 'none' ? imagePreview.src : null;
    
    if (!title || !message || !category) {
      showToast('Please fill all required fields!', 'error');
      return;
    }
    
    if (editingNoticeId) {
      // Show confirmation dialog for update
      if (confirm('Are you sure you want to update this notice?')) {
        const index = notices.findIndex(n => n.id === editingNoticeId);
        if (index !== -1) {
          notices[index] = {
            ...notices[index],
            title,
            message,
            category,
            image,
            updatedAt: new Date().toISOString()
          };
          saveNotices();
          updateNoticesView();
          hideNoticeForm();
          showToast('Notice updated successfully!', 'success');
        }
      }
    } else {
      // Check if we're at max capacity
      if (notices.length >= MAX_NOTICES) {
        showToast(`You've reached the maximum limit of ${MAX_NOTICES} notices. Please delete some notices before adding new ones.`, 'error');
        return;
      }
      
      // Add new notice
      const newNotice = {
        id: generateId(),
        title,
        message,
        category,
        image,
        date: new Date().toISOString(),
        updatedAt: null
      };
      notices.unshift(newNotice);
      saveNotices();
      updateNoticesView();
      hideNoticeForm();
      showToast('Notice added successfully!', 'success');
    }
  } catch (error) {
    console.error('Error saving notice:', error);
    showToast('Error saving notice. Please try again.', 'error');
  }
}

/**
 * Deletes a notice
 * @param {string} id - The ID of the notice to delete
 */
function deleteNotice(id) {
  try {
    if (!isAuthorized()) {
      showToast('Please login to delete notices', 'error');
      return;
    }
    
    if (confirm("Are you sure you want to delete this notice?")) {
      notices = notices.filter(notice => notice.id !== id);
      saveNotices();
      updateNoticesView();
      showToast('Notice deleted successfully!', 'success');
    }
  } catch (error) {
    console.error('Error deleting notice:', error);
    showToast('Error deleting notice. Please try again.', 'error');
  }
}

/**
 * Filter notices based on current search and category filters
 * @returns {Array} - Filtered notices
 */
function getFilteredNotices() {
  try {
    return notices.filter(notice => {
      const matchesSearch = searchTerm ? 
        (notice.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
         notice.message.toLowerCase().includes(searchTerm.toLowerCase())) :
        true;
        
      const matchesCategory = currentCategory ? 
        notice.category === currentCategory :
        true;
        
      return matchesSearch && matchesCategory;
    });
  } catch (error) {
    console.error('Error filtering notices:', error);
    return notices;
  }
}

/**
 * Sort filtered notices based on current sort option
 * @param {Array} filteredNotices - Notices to sort
 * @returns {Array} - Sorted notices
 */
function getSortedNotices(filteredNotices) {
  try {
    const sorted = [...filteredNotices];
    
    switch (currentSort) {
      case 'newest':
        return sorted.sort((a, b) => new Date(b.date) - new Date(a.date));
      case 'oldest':
        return sorted.sort((a, b) => new Date(a.date) - new Date(b.date));
      case 'alphabetical':
        return sorted.sort((a, b) => a.title.localeCompare(b.title));
      default:
        return sorted;
    }
  } catch (error) {
    console.error('Error sorting notices:', error);
    return filteredNotices;
  }
}

/**
 * Get the notices for the current page
 * @param {Array} sortedNotices - All sorted notices
 * @returns {Array} - Paginated notices
 */
function getPaginatedNotices(sortedNotices) {
  try {
    const startIndex = (currentPage - 1) * NOTICES_PER_PAGE;
    return sortedNotices.slice(startIndex, startIndex + NOTICES_PER_PAGE);
  } catch (error) {
    console.error('Error paginating notices:', error);
    return sortedNotices;
  }
}

/**
 * Updates the notices view including pagination
 */
function updateNoticesView() {
  try {
    const filteredNotices = getFilteredNotices();
    const sortedNotices = getSortedNotices(filteredNotices);
    const paginatedNotices = getPaginatedNotices(sortedNotices);
    
    renderNotices(paginatedNotices, filteredNotices.length);
    renderPagination(filteredNotices.length);
    
    // Scroll to top when view updates
    const noticesSection = document.querySelector('.notices-section');
    if (noticesSection) {
      noticesSection.scrollTop = 0;
    }
  } catch (error) {
    console.error('Error updating notices view:', error);
    showToast('Error updating notices view. Please refresh the page.', 'error');
  }
}

/**
 * Opens the modal with notice details
 * @param {string} id - Notice ID
 */
function openNoticeModal(id) {
  try {
    const notice = notices.find(n => n.id === id);
    if (!notice) {
      showToast('Notice not found', 'error');
      return;
    }
    
    modalContent.innerHTML = '';
    
    const noticeElement = document.createElement('div');
    noticeElement.className = 'modal-notice';
    
    const formattedDate = formatDate(notice.date);
    const updatedText = notice.updatedAt ? `Updated: ${formatDate(notice.updatedAt)}` : '';
    
    noticeElement.innerHTML = `
      <div class="modal-notice-header">
        <span class="notice-category category-${notice.category}">${notice.category}</span>
        <h2 class="modal-notice-title">${escapeHTML(notice.title)}</h2>
      </div>
      <div class="modal-notice-content">
        ${escapeHTML(notice.message)}
      </div>
      ${notice.image ? `<div class="modal-notice-image"><img src="${notice.image}" alt="${escapeHTML(notice.title)}"></div>` : ''}
      <div class="modal-notice-footer">
        <span class="notice-date">
          ${formattedDate}
          ${updatedText ? `<br>${updatedText}` : ''}
        </span>
      </div>
    `;
    
    modalContent.appendChild(noticeElement);
    noticeModal.style.display = 'block';
  } catch (error) {
    console.error('Error opening notice modal:', error);
    showToast('Error opening notice details. Please try again.', 'error');
  }
}

/**
 * Closes the notice modal
 */
function closeModal() {
  try {
    noticeModal.style.display = 'none';
  } catch (error) {
    console.error('Error closing modal:', error);
  }
}

/**
 * Renders notices to the DOM
 * @param {Array} noticesToRender - Notices to display
 * @param {number} totalNotices - Total count of filtered notices
 */
function renderNotices(noticesToRender, totalNotices) {
  try {
    const noticesContainer = document.getElementById('notices');
    noticesContainer.innerHTML = '';
    
    if (noticesToRender.length === 0) {
      noticesContainer.innerHTML = `
        <div class="no-notices">
          <h3>No notices found</h3>
          <p>${totalNotices === 0 ? 'Add a new notice to get started!' : 'Try adjusting your search or filters.'}</p>
        </div>
      `;
      return;
    }
    
    // Create notices grid
    const noticesGrid = document.createElement('div');
    noticesGrid.className = 'notices-grid';
    
    // Add each notice to the grid
    noticesToRender.forEach(notice => {
      const noticeElement = createNoticeElement(notice);
      noticesGrid.appendChild(noticeElement);
    });
    
    // Add navigation buttons
    const prevBtn = document.createElement('button');
    prevBtn.className = 'notice-nav prev';
    prevBtn.innerHTML = '<i class="fas fa-chevron-left" aria-hidden="true"></i>';
    prevBtn.onclick = () => scrollNotices('prev');
    
    const nextBtn = document.createElement('button');
    nextBtn.className = 'notice-nav next';
    nextBtn.innerHTML = '<i class="fas fa-chevron-right" aria-hidden="true"></i>';
    nextBtn.onclick = () => scrollNotices('next');
    
    // Add all elements to container
    noticesContainer.appendChild(prevBtn);
    noticesContainer.appendChild(noticesGrid);
    noticesContainer.appendChild(nextBtn);
    
    // Update navigation buttons visibility
    updateNavButtons();
    
    // Add scroll event listener
    noticesGrid.addEventListener('scroll', updateNavButtons);
  } catch (error) {
    console.error('Error rendering notices:', error);
    showToast('Error displaying notices. Please refresh the page.', 'error');
  }
}

/**
 * Updates navigation buttons visibility based on scroll position
 */
function updateNavButtons() {
  const noticesGrid = document.querySelector('.notices-grid');
  const prevBtn = document.querySelector('.notice-nav.prev');
  const nextBtn = document.querySelector('.notice-nav.next');
  
  if (noticesGrid && prevBtn && nextBtn) {
    prevBtn.style.display = noticesGrid.scrollLeft > 0 ? 'flex' : 'none';
    nextBtn.style.display = noticesGrid.scrollLeft + noticesGrid.clientWidth < noticesGrid.scrollWidth ? 'flex' : 'none';
  }
}

/**
 * Scrolls the notices horizontally
 * @param {string} direction - 'prev' or 'next'
 */
function scrollNotices(direction) {
  try {
    const noticesGrid = document.querySelector('.notices-grid');
    if (!noticesGrid) return;
    
    const scrollAmount = 300; // Width of a notice card + gap
    const scrollOptions = {
      left: direction === 'prev' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    };
    
    noticesGrid.scrollBy(scrollOptions);
  } catch (error) {
    console.error('Error scrolling notices:', error);
  }
}

/**
 * Creates a notice element
 * @param {Object} notice - Notice object
 * @returns {HTMLElement} - Notice element
 */
function createNoticeElement(notice) {
  try {
    const noticeElement = document.createElement('div');
    noticeElement.className = 'notice';
    noticeElement.dataset.id = notice.id;

    // Create notice header
    const header = document.createElement('div');
    header.className = 'notice-header';
    
    const title = document.createElement('h3');
    title.className = 'notice-title';
    title.textContent = notice.title;
    header.appendChild(title);

    // Create notice content
    const content = document.createElement('div');
    content.className = 'notice-content';
    
    const message = document.createElement('p');
    message.className = 'notice-message';
    message.textContent = notice.message;
    content.appendChild(message);

    if (notice.image) {
      const imageContainer = document.createElement('div');
      imageContainer.className = 'notice-image';
      const image = document.createElement('img');
      image.src = notice.image;
      image.alt = notice.title;
      imageContainer.appendChild(image);
      content.appendChild(imageContainer);
    }

    // Create notice footer
    const footer = document.createElement('div');
    footer.className = 'notice-footer';
    
    const date = document.createElement('div');
    date.className = 'notice-date';
    date.textContent = formatDate(notice.date);
    footer.appendChild(date);

    const actions = document.createElement('div');
    actions.className = 'notice-actions';

    // Create view button
    const viewBtn = document.createElement('button');
    viewBtn.className = 'view-btn';
    viewBtn.innerHTML = '<i class="fas fa-eye"></i> View';
    viewBtn.onclick = () => openNoticeModal(notice.id);

    // Add view button to actions
    actions.appendChild(viewBtn);

    // Add edit and delete buttons if user is authorized
    if (isAuthorized()) {
      const editBtn = document.createElement('button');
      editBtn.className = 'edit-btn';
      editBtn.innerHTML = '<i class="fas fa-edit"></i> Edit';
      editBtn.onclick = () => showEditNoticeForm(notice.id);

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'delete-btn';
      deleteBtn.innerHTML = '<i class="fas fa-trash"></i> Delete';
      deleteBtn.onclick = () => deleteNotice(notice.id);

      actions.appendChild(editBtn);
      actions.appendChild(deleteBtn);
    }

    footer.appendChild(actions);

    // Assemble notice element
    noticeElement.appendChild(header);
    noticeElement.appendChild(content);
    noticeElement.appendChild(footer);

    return noticeElement;
  } catch (error) {
    console.error('Error creating notice element:', error);
    return null;
  }
}

/**
 * Renders pagination controls
 * @param {number} totalNotices - Total count of filtered notices
 */
function renderPagination(totalNotices) {
  try {
    paginationContainer.innerHTML = '';
    
    if (totalNotices <= NOTICES_PER_PAGE) return;
    
    const pageCount = Math.ceil(totalNotices / NOTICES_PER_PAGE);
    
    // Previous button
    if (currentPage > 1) {
      const prevBtn = document.createElement('button');
      prevBtn.className = 'pagination-btn prev';
      prevBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>';
      prevBtn.addEventListener('click', () => goToPage(currentPage - 1));
      paginationContainer.appendChild(prevBtn);
    }
    
    // Page numbers
    for (let i = 1; i <= pageCount; i++) {
      if (pageCount > 7) {
        // Show limited page numbers for better UI when there are many pages
        if (
          i === 1 || 
          i === pageCount || 
          (i >= currentPage - 1 && i <= currentPage + 1)
        ) {
          addPageButton(i);
        } else if (
          (i === currentPage - 2 && currentPage > 3) || 
          (i === currentPage + 2 && currentPage < pageCount - 2)
        ) {
          const ellipsis = document.createElement('span');
          ellipsis.textContent = '...';
          ellipsis.className = 'pagination-ellipsis';
          paginationContainer.appendChild(ellipsis);
        }
      } else {
        addPageButton(i);
      }
    }
    
    // Next button
    if (currentPage < pageCount) {
      const nextBtn = document.createElement('button');
      nextBtn.className = 'pagination-btn next';
      nextBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>';
      nextBtn.addEventListener('click', () => goToPage(currentPage + 1));
      paginationContainer.appendChild(nextBtn);
    }
  } catch (error) {
    console.error('Error rendering pagination:', error);
  }
}

/**
 * Adds a page button to the pagination container
 * @param {number} pageNum - Page number
 */
function addPageButton(pageNum) {
  try {
    const pageBtn = document.createElement('button');
    pageBtn.textContent = pageNum;
    pageBtn.addEventListener('click', () => goToPage(pageNum));
    pageBtn.className = 'pagination-btn';
    
    if (pageNum === currentPage) {
      pageBtn.classList.add('active');
    }
    
    paginationContainer.appendChild(pageBtn);
  } catch (error) {
    console.error('Error adding page button:', error);
  }
}

/**
 * Navigate to a specific page
 * @param {number} pageNum - Page number to navigate to
 */
function goToPage(pageNum) {
  try {
    currentPage = pageNum;
    updateNoticesView();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (error) {
    console.error('Error navigating to page:', error);
  }
}

/**
 * Handles search input changes
 */
function handleSearch() {
  try {
    searchTerm = searchInput.value.trim().toLowerCase();
    currentPage = 1;  // Reset to first page on new search
    updateNoticesView();
  } catch (error) {
    console.error('Error handling search:', error);
  }
}

/**
 * Handles sort option changes
 */
function handleSortChange() {
  try {
    currentSort = sortOption.value;
    updateNoticesView();
  } catch (error) {
    console.error('Error handling sort change:', error);
  }
}

/**
 * Handles category filter changes
 */
function handleCategoryFilter() {
  try {
    currentCategory = categoryFilter.value;
    currentPage = 1;
    updateNoticesView();
  } catch (error) {
    console.error('Error handling category filter:', error);
  }
}

/**
 * Toggles between dark and light themes
 */
function toggleTheme() {
  try {
    darkMode = !darkMode;
    localStorage.setItem('darkMode', darkMode);
    updateTheme();
  } catch (error) {
    console.error('Error toggling theme:', error);
  }
}

/**
 * Updates the theme based on darkMode state
 */
function updateTheme() {
  try {
    if (darkMode) {
      document.body.classList.add('dark-mode');
      themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    } else {
      document.body.classList.remove('dark-mode');
      themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    }
  } catch (error) {
    console.error('Error updating theme:', error);
  }
}

/**
 * Formats a date string for display
 * @param {string} dateString - ISO date string
 * @returns {string} - Formatted date
 */
function formatDate(dateString) {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString;
  }
}

/**
 * Generates a unique ID for new notices
 * @returns {string} - Unique ID
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

/**
 * Escapes HTML to prevent XSS
 * @param {string} html - String that might contain HTML
 * @returns {string} - Escaped string
 */
function escapeHTML(html) {
  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
}

/**
 * Checks if user is authorized for admin actions
 * @returns {boolean} - Whether user is authorized
 */
function isAuthorized() {
  try {
    return currentUser && currentUser.role === 'admin';
  } catch (error) {
    console.error('Error checking authorization:', error);
    return false;
  }
}

// Make functions available to global scope
window.openNoticeModal = openNoticeModal;
window.deleteNotice = deleteNotice;
window.showEditNoticeForm = showEditNoticeForm;
window.scrollNotices = scrollNotices;
window.goToPage = goToPage;

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', init);