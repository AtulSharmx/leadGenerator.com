// LeadGen Pro - Premium Lead Generation Tool
// Configuration
const CONFIG = {
    SERP_API_KEY: '291b5dbbaace956665bae4f1d5cc8993f306bbc691ddb1a8ca829af7835f5743',
    SERP_API_URL: 'https://serpapi.com/search',
    RESULTS_PER_PAGE: 10,
    MAX_RESULTS: 100
};

// Global State
let currentLeads = [];
let filteredLeads = [];
let currentPage = 1;
let isSearching = false;
let searchTimeout = null;

// DOM Elements
const elements = {
    loadingScreen: document.getElementById('loading-screen'),
    mainApp: document.getElementById('main-app'),
    searchForm: document.getElementById('search-form'),
    searchQuery: document.getElementById('search-query'),
    nicheFilter: document.getElementById('niche-filter'),
    locationFilter: document.getElementById('location-filter'),
    companySizeFilter: document.getElementById('company-size-filter'),
    industryFilter: document.getElementById('industry-filter'),
    budgetRangeFilter: document.getElementById('budget-range-filter'),
    experienceLevelFilter: document.getElementById('experience-level-filter'),
    progressSection: document.getElementById('progress-section'),
    progressText: document.getElementById('progress-text'),
    progressFill: document.getElementById('progress-fill'),
    leadsFound: document.getElementById('leads-found'),
    leadsProcessed: document.getElementById('leads-processed'),
    resultsSection: document.getElementById('results-section'),
    resultsCount: document.getElementById('results-count'),
    leadsList: document.getElementById('leads-list'),
    leadsSearch: document.getElementById('leads-search'),
    exportCsv: document.getElementById('export-csv'),
    exportJson: document.getElementById('export-json'),
    pagination: document.getElementById('pagination'),
    prevPage: document.getElementById('prev-page'),
    nextPage: document.getElementById('next-page'),
    pageNumbers: document.getElementById('page-numbers'),
    totalLeads: document.getElementById('total-leads'),
    filteredLeads: document.getElementById('filtered-leads'),
    themeToggle: document.getElementById('theme-toggle'),
    toastContainer: document.getElementById('toast-container')
};

// Initialize App
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    setupMobileOptimizations();
    startLoadingAnimation();
});

// Initialize App
function initializeApp() {
    // Set initial theme
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
    
    // Initialize filters
    initializeFilters();
    
    // Setup search functionality
    setupSearchFunctionality();
}

// Setup Event Listeners
function setupEventListeners() {
    // Search form
    elements.searchForm.addEventListener('submit', handleSearch);
    
    // Theme toggle
    elements.themeToggle.addEventListener('click', toggleTheme);
    
    // Export buttons
    elements.exportCsv.addEventListener('click', () => exportLeads('csv'));
    elements.exportJson.addEventListener('click', () => exportLeads('json'));
    
    // Pagination
    elements.prevPage.addEventListener('click', () => changePage(currentPage - 1));
    elements.nextPage.addEventListener('click', () => changePage(currentPage + 1));
    
    // Lead search
    elements.leadsSearch.addEventListener('input', debounce(handleLeadSearch, 300));
    
    // Filter changes
    elements.nicheFilter.addEventListener('input', debounce(handleFilterChange, 300));
    elements.locationFilter.addEventListener('input', debounce(handleFilterChange, 300));
    elements.companySizeFilter.addEventListener('change', debounce(handleFilterChange, 300));
    elements.industryFilter.addEventListener('input', debounce(handleFilterChange, 300));
    elements.budgetRangeFilter.addEventListener('change', debounce(handleFilterChange, 300));
    elements.experienceLevelFilter.addEventListener('change', debounce(handleFilterChange, 300));
}

// Start Loading Animation
function startLoadingAnimation() {
    setTimeout(() => {
        elements.loadingScreen.style.opacity = '0';
        setTimeout(() => {
            elements.loadingScreen.classList.add('hidden');
            elements.mainApp.classList.remove('hidden');
            elements.mainApp.classList.add('fade-in');
        }, 500);
    }, 3000);
}

// Initialize Filters
function initializeFilters() {
    // Location filter is now a text input, no initialization needed
}

// Setup Mobile Optimizations
function setupMobileOptimizations() {
    // Prevent zoom on input focus (iOS)
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        input.addEventListener('focus', () => {
            if (window.innerWidth <= 768) {
                document.querySelector('meta[name="viewport"]').content = 
                    'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
            }
        });
        
        input.addEventListener('blur', () => {
            document.querySelector('meta[name="viewport"]').content = 
                'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
        });
    });
    
    // Handle orientation change
    window.addEventListener('orientationchange', () => {
        setTimeout(() => {
            window.scrollTo(0, 0);
        }, 100);
    });
    
    // Prevent pull-to-refresh on mobile
    document.addEventListener('touchstart', function(e) {
        if (e.touches.length > 1) {
            e.preventDefault();
        }
    }, { passive: false });
    
    let lastTouchEnd = 0;
    document.addEventListener('touchend', function(e) {
        const now = (new Date()).getTime();
        if (now - lastTouchEnd <= 300) {
            e.preventDefault();
        }
        lastTouchEnd = now;
    }, false);
    
    // Optimize scroll performance
    let ticking = false;
    function updateScroll() {
        // Add any scroll-based optimizations here
        ticking = false;
    }
    
    window.addEventListener('scroll', function() {
        if (!ticking) {
            requestAnimationFrame(updateScroll);
            ticking = true;
        }
    });
}

// Setup Search Functionality
function setupSearchFunctionality() {
    // Add search suggestions
    const suggestions = [
        'digital marketing agencies',
        'web development companies',
        'SEO services',
        'social media marketing',
        'content marketing agencies',
        'PPC advertising services',
        'e-commerce development',
        'mobile app development',
        'graphic design services',
        'branding agencies'
    ];
    
    elements.searchQuery.addEventListener('focus', () => {
        if (!elements.searchQuery.value) {
            showSuggestions(suggestions);
        }
    });
}

// Show Search Suggestions
function showSuggestions(suggestions) {
    // This would typically show a dropdown with suggestions
    // For now, we'll just add placeholder text
    elements.searchQuery.placeholder = 'e.g., ' + suggestions[Math.floor(Math.random() * suggestions.length)];
}

// Handle Search
async function handleSearch(e) {
    e.preventDefault();
    
    if (isSearching) return;
    
    const query = elements.searchQuery.value.trim();
    const niche = elements.nicheFilter.value.trim();
    const location = elements.locationFilter.value.trim();
    const companySize = elements.companySizeFilter.value;
    const industry = elements.industryFilter.value.trim();
    const budgetRange = elements.budgetRangeFilter.value;
    const experienceLevel = elements.experienceLevelFilter.value;
    
    if (!query) {
        showToast('error', 'Please enter a search query');
        return;
    }
    
    if (!niche) {
        showToast('error', 'Please enter a niche');
        return;
    }
    
    if (!location) {
        showToast('error', 'Please enter a location');
        return;
    }
    
    isSearching = true;
    updateSearchButton(true);
    showProgressSection();
    
    try {
        // Combine all filter values with the search query for better results
        let enhancedQuery = `${query} ${niche} ${location}`;
        if (industry) enhancedQuery += ` ${industry}`;
        if (companySize) enhancedQuery += ` ${companySize} company`;
        if (budgetRange) enhancedQuery += ` ${budgetRange} budget`;
        if (experienceLevel) enhancedQuery += ` ${experienceLevel}`;
        
        const leads = await generateLeads(enhancedQuery);
        currentLeads = leads;
        filteredLeads = [...leads];
        
        updateStats();
        displayLeads();
        showResultsSection();
        showToast('success', `Found ${leads.length} leads!`);
        
    } catch (error) {
        console.error('Search error:', error);
        showToast('error', 'Failed to generate leads. Please try again.');
    } finally {
        isSearching = false;
        updateSearchButton(false);
        hideProgressSection();
    }
}

// Generate Leads using SERP API
async function generateLeads(query) {
    const leads = [];
    let progress = 0;
    
    // Real progress updates
    const progressInterval = setInterval(() => {
        progress += Math.random() * 10;
        if (progress > 85) progress = 85;
        updateProgress(progress, 'Searching Google results...');
    }, 300);
    
    try {
        // Make SERP API request with real parameters
        const apiUrl = `${CONFIG.SERP_API_URL}?api_key=${CONFIG.SERP_API_KEY}&q=${encodeURIComponent(query)}&engine=google&num=20&gl=in&hl=en`;
        
        updateProgress(20, 'Connecting to SERP API...');
        
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            throw new Error(`API request failed: ${response.status} - ${response.statusText}`);
        }
        
        const data = await response.json();
        
        clearInterval(progressInterval);
        updateProgress(90, 'Processing results...');
        
        // Process organic results
        if (data.organic_results && data.organic_results.length > 0) {
            for (const result of data.organic_results) {
                const lead = processSearchResult(result, query);
                if (lead) {
                    leads.push(lead);
                }
            }
        }
        
        // Process local results if available
        if (data.local_results && data.local_results.length > 0) {
            for (const result of data.local_results) {
                const lead = processLocalResult(result, query);
                if (lead) {
                    leads.push(lead);
                }
            }
        }
        
        // Process knowledge graph results if available
        if (data.knowledge_graph) {
            const lead = processKnowledgeGraphResult(data.knowledge_graph, query);
            if (lead) {
                leads.push(lead);
            }
        }
        
        updateProgress(95, 'Enhancing lead data...');
        
        // Remove duplicates and enhance data
        const uniqueLeads = removeDuplicates(leads);
        const enhancedLeads = await enhanceLeads(uniqueLeads);
        
        updateProgress(100, 'Complete!');
        
        return enhancedLeads.slice(0, CONFIG.MAX_RESULTS);
        
    } catch (error) {
        clearInterval(progressInterval);
        console.error('SERP API Error:', error);
        throw new Error(`Failed to fetch leads: ${error.message}`);
    }
}

// Process Search Result
function processSearchResult(result, query) {
    if (!result.title || !result.link) return null;
    
    const lead = {
        id: generateId(),
        name: extractCompanyName(result.title),
        website: result.link,
        description: result.snippet || '',
        phone: extractPhone(result.snippet || ''),
        email: extractEmail(result.snippet || ''),
        address: extractAddress(result.snippet || ''),
        socialMedia: {},
        rating: extractRating(result),
        reviews: extractReviews(result),
        category: categorizeBusiness(result.title, result.snippet || ''),
        location: extractLocation(result.title, result.snippet || '', query),
        companySize: estimateCompanySize(result.title, result.snippet || ''),
        priority: calculatePriority(result),
        verified: false,
        lastUpdated: new Date().toISOString()
    };
    
    return lead;
}

// Process Local Result
function processLocalResult(result, query) {
    if (!result.title) return null;
    
    const lead = {
        id: generateId(),
        name: result.title,
        website: result.website || '',
        description: result.snippet || '',
        phone: result.phone || '',
        email: extractEmail(result.snippet || ''),
        address: result.address || '',
        socialMedia: {},
        rating: result.rating || null,
        reviews: result.reviews || null,
        category: categorizeBusiness(result.title, result.snippet || ''),
        location: result.address || extractLocation(result.title, result.snippet || '', query),
        companySize: estimateCompanySize(result.title, result.snippet || ''),
        priority: calculatePriority(result),
        verified: true,
        lastUpdated: new Date().toISOString()
    };
    
    return lead;
}

// Process Knowledge Graph Result
function processKnowledgeGraphResult(kg, query) {
    if (!kg.title) return null;
    
    const lead = {
        id: generateId(),
        name: kg.title,
        website: kg.website || '',
        description: kg.description || '',
        phone: kg.phone || '',
        email: '',
        address: kg.address || '',
        socialMedia: {},
        rating: kg.rating || null,
        reviews: kg.reviews || null,
        category: categorizeBusiness(kg.title, kg.description || ''),
        location: kg.address || extractLocation(kg.title, kg.description || '', query),
        companySize: estimateCompanySize(kg.title, kg.description || ''),
        priority: calculatePriority(kg),
        verified: true,
        lastUpdated: new Date().toISOString()
    };
    
    return lead;
}

// Extract Company Name
function extractCompanyName(title) {
    // Remove common suffixes and clean up
    return title
        .replace(/\s*-\s*.*$/, '') // Remove everything after dash
        .replace(/\s*\|\s*.*$/, '') // Remove everything after pipe
        .replace(/\s*:\s*.*$/, '') // Remove everything after colon
        .replace(/\s*\(.*\)$/, '') // Remove parentheses
        .trim();
}

// Extract Phone Number
function extractPhone(text) {
    if (!text) return '';
    // Enhanced phone regex for Indian and international numbers
    const phoneRegex = /(\+?91[\s-]?)?[6-9]\d{9}|(\+?1[\s-]?)?\(?[0-9]{3}\)?[\s-]?[0-9]{3}[\s-]?[0-9]{4}|(\+?[0-9]{1,3}[\s-]?)?[0-9]{8,15}/g;
    const match = text.match(phoneRegex);
    return match ? match[0].replace(/\s+/g, '') : '';
}

// Extract Address
function extractAddress(text) {
    if (!text) return '';
    // Look for address patterns
    const addressRegex = /([A-Za-z\s]+(?:Street|St|Road|Rd|Avenue|Ave|Lane|Ln|Drive|Dr|Boulevard|Blvd|Place|Pl|Suite|Ste|Floor|Fl|Unit|Apt|Building|Bldg)[A-Za-z0-9\s,.-]*)/i;
    const match = text.match(addressRegex);
    return match ? match[0].trim() : '';
}

// Extract Rating
function extractRating(result) {
    if (result.rating) return result.rating;
    if (result.snippet) {
        const ratingRegex = /(\d+\.?\d*)\s*(?:stars?|★|⭐)/i;
        const match = result.snippet.match(ratingRegex);
        return match ? parseFloat(match[1]) : null;
    }
    return null;
}

// Extract Reviews
function extractReviews(result) {
    if (result.reviews) return result.reviews;
    if (result.snippet) {
        const reviewRegex = /(\d+(?:,\d+)*)\s*(?:reviews?|ratings?)/i;
        const match = result.snippet.match(reviewRegex);
        return match ? parseInt(match[1].replace(/,/g, '')) : null;
    }
    return null;
}

// Extract Email
function extractEmail(text) {
    if (!text) return '';
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const match = text.match(emailRegex);
    return match ? match[0] : '';
}

// Extract Location
function extractLocation(title, snippet, query) {
    const text = `${title} ${snippet} ${query}`.toLowerCase();
    const locations = ['gurgaon', 'delhi', 'mumbai', 'bangalore', 'hyderabad', 'pune', 'chennai', 'kolkata'];
    
    for (const location of locations) {
        if (text.includes(location)) {
            return location.charAt(0).toUpperCase() + location.slice(1);
        }
    }
    
    return '';
}

// Categorize Business
function categorizeBusiness(title, snippet) {
    const text = `${title} ${snippet}`.toLowerCase();
    
    if (text.includes('marketing') || text.includes('advertising') || text.includes('seo')) {
        return 'Marketing';
    } else if (text.includes('web') || text.includes('development') || text.includes('software')) {
        return 'Technology';
    } else if (text.includes('finance') || text.includes('banking') || text.includes('investment')) {
        return 'Finance';
    } else if (text.includes('health') || text.includes('medical') || text.includes('hospital')) {
        return 'Healthcare';
    } else if (text.includes('education') || text.includes('school') || text.includes('training')) {
        return 'Education';
    } else if (text.includes('retail') || text.includes('shop') || text.includes('store')) {
        return 'Retail';
    }
    
    return 'Other';
}

// Estimate Company Size
function estimateCompanySize(title, snippet) {
    const text = `${title} ${snippet}`.toLowerCase();
    
    if (text.includes('startup') || text.includes('small') || text.includes('freelance')) {
        return 'startup';
    } else if (text.includes('enterprise') || text.includes('corporate') || text.includes('large')) {
        return 'large';
    } else if (text.includes('medium') || text.includes('mid-size')) {
        return 'medium';
    }
    
    return 'small';
}

// Calculate Priority
function calculatePriority(result) {
    let score = 0;
    
    // Website presence
    if (result.link) score += 2;
    
    // Phone number
    if (result.phone) score += 2;
    
    // Rating/reviews
    if (result.rating) score += 3;
    
    // Description quality
    if (result.snippet && result.snippet.length > 50) score += 1;
    
    // Local business
    if (result.address) score += 2;
    
    return Math.min(score, 10);
}

// Remove Duplicates
function removeDuplicates(leads) {
    const seen = new Set();
    return leads.filter(lead => {
        const key = lead.name.toLowerCase() + lead.website;
        if (seen.has(key)) {
            return false;
        }
        seen.add(key);
        return true;
    });
}

// Enhance Leads
async function enhanceLeads(leads) {
    // Enhance leads with additional data extraction
    return leads.map(lead => {
        // Extract social media links from description
        const socialMedia = extractSocialMedia(lead.description);
        
        // Enhance company name
        const enhancedName = enhanceCompanyName(lead.name);
        
        // Extract additional contact info
        const additionalInfo = extractAdditionalInfo(lead.description);
        
        return {
            ...lead,
            name: enhancedName,
            socialMedia: {
                linkedin: socialMedia.linkedin || generateLinkedInUrl(lead.name),
                facebook: socialMedia.facebook || '',
                twitter: socialMedia.twitter || '',
                instagram: socialMedia.instagram || ''
            },
            ...additionalInfo
        };
    });
}

// Extract Social Media Links
function extractSocialMedia(text) {
    const socialMedia = {};
    
    // LinkedIn
    const linkedinRegex = /linkedin\.com\/company\/([a-zA-Z0-9-]+)/i;
    const linkedinMatch = text.match(linkedinRegex);
    if (linkedinMatch) {
        socialMedia.linkedin = `https://linkedin.com/company/${linkedinMatch[1]}`;
    }
    
    // Facebook
    const facebookRegex = /facebook\.com\/([a-zA-Z0-9.-]+)/i;
    const facebookMatch = text.match(facebookRegex);
    if (facebookMatch) {
        socialMedia.facebook = `https://facebook.com/${facebookMatch[1]}`;
    }
    
    // Twitter
    const twitterRegex = /twitter\.com\/([a-zA-Z0-9_]+)/i;
    const twitterMatch = text.match(twitterRegex);
    if (twitterMatch) {
        socialMedia.twitter = `https://twitter.com/${twitterMatch[1]}`;
    }
    
    return socialMedia;
}

// Generate LinkedIn URL
function generateLinkedInUrl(companyName) {
    const cleanName = companyName
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '-')
        .replace(/^-+|-+$/g, '');
    
    return `https://linkedin.com/company/${cleanName}`;
}

// Enhance Company Name
function enhanceCompanyName(name) {
    // Remove common web suffixes and clean up
    return name
        .replace(/\s*-\s*.*$/, '') // Remove everything after dash
        .replace(/\s*\|\s*.*$/, '') // Remove everything after pipe
        .replace(/\s*:\s*.*$/, '') // Remove everything after colon
        .replace(/\s*\(.*\)$/, '') // Remove parentheses
        .replace(/\s*\[.*\]$/, '') // Remove brackets
        .replace(/\s*\{.*\}$/, '') // Remove braces
        .trim();
}

// Extract Additional Info
function extractAdditionalInfo(text) {
    const info = {};
    
    // Extract years in business
    const yearsRegex = /(\d+)\s*(?:years?|yrs?)\s*(?:in business|experience|old)/i;
    const yearsMatch = text.match(yearsRegex);
    if (yearsMatch) {
        info.yearsInBusiness = parseInt(yearsMatch[1]);
    }
    
    // Extract employee count
    const employeesRegex = /(\d+(?:,\d+)*)\s*(?:employees?|staff|team members?)/i;
    const employeesMatch = text.match(employeesRegex);
    if (employeesMatch) {
        info.employeeCount = parseInt(employeesMatch[1].replace(/,/g, ''));
    }
    
    return info;
}

// Update Progress
function updateProgress(percentage, text) {
    elements.progressFill.style.width = `${percentage}%`;
    elements.progressText.textContent = text;
    elements.leadsFound.textContent = Math.floor(percentage / 10);
    elements.leadsProcessed.textContent = Math.floor(percentage / 5);
}

// Show Progress Section
function showProgressSection() {
    elements.progressSection.classList.remove('hidden');
    elements.progressSection.classList.add('slide-up');
}

// Hide Progress Section
function hideProgressSection() {
    elements.progressSection.classList.add('hidden');
}

// Update Search Button
function updateSearchButton(loading) {
    const btn = elements.searchForm.querySelector('.search-btn');
    const btnText = btn.querySelector('.btn-text');
    const btnIcon = btn.querySelector('i');
    
    if (loading) {
        btn.disabled = true;
        btnText.textContent = 'Generating...';
        btnIcon.className = 'fas fa-spinner fa-spin';
    } else {
        btn.disabled = false;
        btnText.textContent = 'Generate Leads';
        btnIcon.className = 'fas fa-arrow-right';
    }
}

// Display Leads
function displayLeads() {
    const startIndex = (currentPage - 1) * CONFIG.RESULTS_PER_PAGE;
    const endIndex = startIndex + CONFIG.RESULTS_PER_PAGE;
    const pageLeads = filteredLeads.slice(startIndex, endIndex);
    
    elements.leadsList.innerHTML = '';
    
    if (pageLeads.length === 0) {
        elements.leadsList.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search"></i>
                <h3>No leads found</h3>
                <p>Try adjusting your search criteria or filters</p>
            </div>
        `;
        return;
    }
    
    pageLeads.forEach((lead, index) => {
        const leadElement = createLeadElement(lead, startIndex + index);
        elements.leadsList.appendChild(leadElement);
    });
    
    updatePagination();
    updateResultsCount();
}

// Create Lead Element
function createLeadElement(lead, index) {
    const leadDiv = document.createElement('div');
    leadDiv.className = 'lead-item';
    leadDiv.style.animationDelay = `${index * 0.1}s`;
    
    const badges = createBadges(lead);
    const details = createLeadDetails(lead);
    const actions = createLeadActions(lead);
    
    leadDiv.innerHTML = `
        <div class="lead-header">
            <div class="lead-info">
                <h4>${lead.name}</h4>
                <p>${lead.description || 'No description available'}</p>
            </div>
            <div class="lead-badges">
                ${badges}
            </div>
        </div>
        <div class="lead-details">
            ${details}
        </div>
        <div class="lead-actions">
            ${actions}
        </div>
    `;
    
    return leadDiv;
}

// Create Badges
function createBadges(lead) {
    const badges = [];
    
    if (lead.verified) {
        badges.push('<span class="badge badge-success"><i class="fas fa-check"></i> Verified</span>');
    }
    
    if (lead.rating) {
        badges.push(`<span class="badge badge-primary"><i class="fas fa-star"></i> ${lead.rating}</span>`);
    }
    
    if (!lead.email) {
        badges.push('<span class="badge badge-warning"><i class="fas fa-exclamation"></i> No Email</span>');
    }
    
    if (!lead.phone) {
        badges.push('<span class="badge badge-error"><i class="fas fa-phone-slash"></i> No Phone</span>');
    }
    
    if (lead.priority >= 8) {
        badges.push('<span class="badge badge-success"><i class="fas fa-fire"></i> High Priority</span>');
    }
    
    return badges.join('');
}

// Create Lead Details
function createLeadDetails(lead) {
    const details = [];
    
    if (lead.website) {
        details.push(`
            <div class="detail-item">
                <i class="fas fa-globe"></i>
                <a href="${lead.website}" target="_blank" rel="noopener">${lead.website}</a>
            </div>
        `);
    }
    
    if (lead.phone) {
        details.push(`
            <div class="detail-item">
                <i class="fas fa-phone"></i>
                <a href="tel:${lead.phone}">${lead.phone}</a>
            </div>
        `);
    }
    
    if (lead.email) {
        details.push(`
            <div class="detail-item">
                <i class="fas fa-envelope"></i>
                <a href="mailto:${lead.email}">${lead.email}</a>
            </div>
        `);
    }
    
    if (lead.address) {
        details.push(`
            <div class="detail-item">
                <i class="fas fa-map-marker-alt"></i>
                <span>${lead.address}</span>
            </div>
        `);
    }
    
    if (lead.location) {
        details.push(`
            <div class="detail-item">
                <i class="fas fa-location-dot"></i>
                <span>${lead.location}</span>
            </div>
        `);
    }
    
    if (lead.category) {
        details.push(`
            <div class="detail-item">
                <i class="fas fa-tag"></i>
                <span>${lead.category}</span>
            </div>
        `);
    }
    
    return details.join('');
}

// Create Lead Actions
function createLeadActions(lead) {
    const actions = [];
    
    if (lead.website) {
        actions.push(`
            <button class="lead-action-btn" onclick="openWebsite('${lead.website}')">
                <i class="fas fa-external-link-alt"></i>
                Website
            </button>
        `);
    }
    
    if (lead.phone) {
        actions.push(`
            <button class="lead-action-btn" onclick="copyToClipboard('${lead.phone}', 'Phone number copied!')">
                <i class="fas fa-phone"></i>
                Copy Phone
            </button>
        `);
    }
    
    if (lead.email) {
        actions.push(`
            <button class="lead-action-btn" onclick="copyToClipboard('${lead.email}', 'Email copied!')">
                <i class="fas fa-envelope"></i>
                Copy Email
            </button>
        `);
    }
    
    actions.push(`
        <button class="lead-action-btn success" onclick="copyLead('${lead.id}')">
            <i class="fas fa-copy"></i>
            Copy Lead
        </button>
    `);
    
    return actions.join('');
}

// Update Pagination
function updatePagination() {
    const totalPages = Math.ceil(filteredLeads.length / CONFIG.RESULTS_PER_PAGE);
    
    if (totalPages <= 1) {
        elements.pagination.classList.add('hidden');
        return;
    }
    
    elements.pagination.classList.remove('hidden');
    
    // Update prev/next buttons
    elements.prevPage.disabled = currentPage === 1;
    elements.nextPage.disabled = currentPage === totalPages;
    
    // Update page numbers
    elements.pageNumbers.innerHTML = '';
    
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);
    
    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.className = `page-number ${i === currentPage ? 'active' : ''}`;
        pageBtn.textContent = i;
        pageBtn.addEventListener('click', () => changePage(i));
        elements.pageNumbers.appendChild(pageBtn);
    }
}

// Change Page
function changePage(page) {
    const totalPages = Math.ceil(filteredLeads.length / CONFIG.RESULTS_PER_PAGE);
    
    if (page < 1 || page > totalPages) return;
    
    currentPage = page;
    displayLeads();
    
    // Scroll to top of results
    elements.resultsSection.scrollIntoView({ behavior: 'smooth' });
}

// Update Results Count
function updateResultsCount() {
    const total = filteredLeads.length;
    const start = (currentPage - 1) * CONFIG.RESULTS_PER_PAGE + 1;
    const end = Math.min(currentPage * CONFIG.RESULTS_PER_PAGE, total);
    
    elements.resultsCount.textContent = `${total} leads found (showing ${start}-${end})`;
}

// Update Stats
function updateStats() {
    elements.totalLeads.textContent = currentLeads.length;
    elements.filteredLeads.textContent = filteredLeads.length;
}

// Handle Lead Search
function handleLeadSearch() {
    const query = elements.leadsSearch.value.toLowerCase().trim();
    const niche = elements.nicheFilter.value.toLowerCase().trim();
    const location = elements.locationFilter.value.toLowerCase().trim();
    const companySize = elements.companySizeFilter.value;
    const industry = elements.industryFilter.value.toLowerCase().trim();
    const budgetRange = elements.budgetRangeFilter.value;
    const experienceLevel = elements.experienceLevelFilter.value;
    
    if (!query && !niche && !location && !companySize && !industry && !budgetRange && !experienceLevel) {
        filteredLeads = [...currentLeads];
    } else {
        filteredLeads = currentLeads.filter(lead => {
            const searchMatch = !query || 
                lead.name.toLowerCase().includes(query) ||
                lead.description.toLowerCase().includes(query) ||
                lead.category.toLowerCase().includes(query) ||
                lead.location.toLowerCase().includes(query);
            
            const nicheMatch = !niche || 
                lead.category.toLowerCase().includes(niche) || 
                lead.description.toLowerCase().includes(niche);
            
            const locationMatch = !location || 
                lead.location.toLowerCase().includes(location);
            
            const companySizeMatch = !companySize || lead.companySize === companySize;
            const industryMatch = !industry || lead.category.toLowerCase().includes(industry) || lead.description.toLowerCase().includes(industry);
            const budgetMatch = !budgetRange || (lead.budgetRange && lead.budgetRange === budgetRange);
            const experienceMatch = !experienceLevel || (lead.experienceLevel && lead.experienceLevel === experienceLevel);
            
            return searchMatch && nicheMatch && locationMatch && companySizeMatch && industryMatch && budgetMatch && experienceMatch;
        });
    }
    
    currentPage = 1;
    displayLeads();
    updateStats();
}

// Handle Filter Change
function handleFilterChange() {
    const niche = elements.nicheFilter.value.toLowerCase().trim();
    const location = elements.locationFilter.value.toLowerCase().trim();
    const companySize = elements.companySizeFilter.value;
    const industry = elements.industryFilter.value.toLowerCase().trim();
    const budgetRange = elements.budgetRangeFilter.value;
    const experienceLevel = elements.experienceLevelFilter.value;
    
    filteredLeads = currentLeads.filter(lead => {
        const nicheMatch = !niche || lead.category.toLowerCase().includes(niche) || lead.description.toLowerCase().includes(niche);
        const locationMatch = !location || lead.location.toLowerCase().includes(location);
        const companySizeMatch = !companySize || lead.companySize === companySize;
        const industryMatch = !industry || lead.category.toLowerCase().includes(industry) || lead.description.toLowerCase().includes(industry);
        const budgetMatch = !budgetRange || (lead.budgetRange && lead.budgetRange === budgetRange);
        const experienceMatch = !experienceLevel || (lead.experienceLevel && lead.experienceLevel === experienceLevel);
        
        return nicheMatch && locationMatch && companySizeMatch && industryMatch && budgetMatch && experienceMatch;
    });
    
    currentPage = 1;
    displayLeads();
    updateStats();
}

// Show Results Section
function showResultsSection() {
    elements.resultsSection.classList.remove('hidden');
    elements.resultsSection.classList.add('slide-up');
}

// Export Leads
function exportLeads(format) {
    if (filteredLeads.length === 0) {
        showToast('warning', 'No leads to export');
        return;
    }
    
    try {
        if (format === 'csv') {
            exportToCSV(filteredLeads);
        } else if (format === 'json') {
            exportToJSON(filteredLeads);
        }
        
        showToast('success', `Exported ${filteredLeads.length} leads as ${format.toUpperCase()}`);
    } catch (error) {
        console.error('Export error:', error);
        showToast('error', 'Failed to export leads');
    }
}

// Export to CSV
function exportToCSV(leads) {
    const headers = ['Name', 'Website', 'Phone', 'Email', 'Address', 'Location', 'Category', 'Rating', 'Priority'];
    const csvContent = [
        headers.join(','),
        ...leads.map(lead => [
            `"${lead.name}"`,
            `"${lead.website}"`,
            `"${lead.phone}"`,
            `"${lead.email}"`,
            `"${lead.address}"`,
            `"${lead.location}"`,
            `"${lead.category}"`,
            `"${lead.rating || ''}"`,
            `"${lead.priority}"`
        ].join(','))
    ].join('\n');
    
    downloadFile(csvContent, 'leads.csv', 'text/csv');
}

// Export to JSON
function exportToJSON(leads) {
    const jsonContent = JSON.stringify(leads, null, 2);
    downloadFile(jsonContent, 'leads.json', 'application/json');
}

// Download File
function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Copy to Clipboard
function copyToClipboard(text, message) {
    navigator.clipboard.writeText(text).then(() => {
        showToast('success', message);
    }).catch(() => {
        showToast('error', 'Failed to copy to clipboard');
    });
}

// Copy Lead
function copyLead(leadId) {
    const lead = currentLeads.find(l => l.id === leadId);
    if (!lead) return;
    
    const leadText = `
${lead.name}
Website: ${lead.website}
Phone: ${lead.phone}
Email: ${lead.email}
Address: ${lead.address}
Location: ${lead.location}
Category: ${lead.category}
Rating: ${lead.rating || 'N/A'}
Priority: ${lead.priority}/10
    `.trim();
    
    copyToClipboard(leadText, 'Lead copied to clipboard!');
}

// Open Website
function openWebsite(url) {
    window.open(url, '_blank', 'noopener,noreferrer');
}

// Toggle Theme
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
    
    showToast('info', `Switched to ${newTheme} theme`);
}

// Update Theme Icon
function updateThemeIcon(theme) {
    const icon = elements.themeToggle.querySelector('i');
    icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

// Show Toast
function showToast(type, message, title = '') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        warning: 'fas fa-exclamation-triangle',
        info: 'fas fa-info-circle'
    };
    
    toast.innerHTML = `
        <i class="${icons[type]}"></i>
        <div class="toast-content">
            ${title ? `<div class="toast-title">${title}</div>` : ''}
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    elements.toastContainer.appendChild(toast);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (toast.parentElement) {
            toast.remove();
        }
    }, 5000);
}

// Utility Functions
function generateId() {
    return Math.random().toString(36).substr(2, 9);
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Sample data function removed - now using real SERP API data

// Remove sample data initialization - now using real SERP API data
