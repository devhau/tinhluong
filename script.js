// Tính lương thực nhận:23h
class SalaryCalculator {
    constructor() {
        this.nightShiftRate = 1.8; // 30% phụ cấp đêm
        this.workingDays = 26; // Số ngày làm việc tiêu chuẩn trong tháng

        // Overtime rates
        this.overtimeRates = {
            normalDay: 1.5,      // 150%
            normalNight: 2.0,    // 200%
            dayOff: 2.0,         // 200%
            nightDayOff: 2.7,    // 270%
            holiday: 3.0,        // 300%
            nightHoliday: 3.9    // 390%
        };

        // Tax brackets for Vietnamese income tax (2024)
        // Biểu thuế lũy tiến từng phần theo Nghị quyết 954/2020/UBTVQH14
        this.taxBrackets = [
            { min: 0, max: 5000000, rate: 0.05 },      // 5% cho phần thu nhập từ 0 đến 5 triệu
            { min: 5000000, max: 10000000, rate: 0.10 }, // 10% cho phần thu nhập từ 5 đến 10 triệu
            { min: 10000000, max: 18000000, rate: 0.15 }, // 15% cho phần thu nhập từ 10 đến 18 triệu
            { min: 18000000, max: 32000000, rate: 0.20 }, // 20% cho phần thu nhập từ 18 đến 32 triệu
            { min: 32000000, max: 52000000, rate: 0.25 }, // 25% cho phần thu nhập từ 32 đến 52 triệu
            { min: 52000000, max: 80000000, rate: 0.30 }, // 30% cho phần thu nhập từ 52 đến 80 triệu
            { min: 80000000, max: Infinity, rate: 0.35 }  // 35% cho phần thu nhập trên 80 triệu
        ];

        this.init();
    }

    init() {
        this.checkForSharedData();
        this.loadFromLocalStorage();
        this.setupEventListeners();
        this.setupTheme();
        this.formatMoneyInputs();
    }

    // Safari-compatible helper functions
    safeGetElement(id) {
        try {
            console.log('DEBUG: safeGetElement called with id:', id);
            var element = document.getElementById(id);
            console.log('DEBUG: element found:', element);
            return element || null;
        } catch (e) {
            console.warn('Error getting element:', id, e);
            return null;
        }
    }

    safeSetText(id, text) {
        try {
            console.log('DEBUG: safeSetText called with id:', id, 'text:', text);
            var element = this.safeGetElement(id);
            console.log('DEBUG: element found:', element);
            if (element) {
                element.textContent = text;
                console.log('DEBUG: textContent set to:', text);
            } else {
                console.warn('Element with id \'' + id + '\' not found');
            }
        } catch (e) {
            console.error('Error in safeSetText:', e);
        }
    }

    safeGetValue(id, defaultValue) {
        try {
            var element = this.safeGetElement(id);
            if (!element) {
                console.warn('Element with id "' + id + '" not found, using default:', defaultValue);
                return defaultValue;
            }

            var value = element.value;

            // Xử lý giá trị đặc biệt cho các trường hợp với validation nghiêm ngặt
            if (id === 'workingDays' || id === 'dependents') {
                if (value === '' || value === null || value === undefined) {
                    return defaultValue;
                }
                var numericValue = parseInt(String(value), 10);
                return isNaN(numericValue) ? defaultValue : numericValue;
            }

            if (id.includes('Overtime')) {
                if (value === '' || value === null || value === undefined) {
                    return defaultValue;
                }
                var floatValue = parseFloat(String(value));
                return isNaN(floatValue) ? defaultValue : floatValue;
            }

            if (id.includes('Insurance')) {
                if (value === '' || value === null || value === undefined) {
                    return defaultValue;
                }
                var floatValue = parseFloat(String(value));
                return isNaN(floatValue) ? defaultValue : floatValue;
            }

            if (id === 'nightShiftHours') {
                if (value === '' || value === null || value === undefined) {
                    return defaultValue;
                }
                var floatValue = parseFloat(String(value));
                return isNaN(floatValue) ? defaultValue : floatValue;
            }

            return value || defaultValue;
        } catch (error) {
            console.error('Error getting value for', id, error);
            return defaultValue;
        }
    }

    setupAdSense() {
        // AdSense callback functions
        if (typeof window.adsbygoogle === 'undefined') {
            window.adsbygoogle = [];
        }
        var adsbygoogle = window.adsbygoogle;

        // Push ad with callback to handle loading state
        adsbygoogle.push({
            google_ad_client: "ca-pub-7587631210958149",
            enable_page_level_ads: true
        });

        // Set up simple ad loading detection after a delay
        var self = this;
        setTimeout(function() {
            self.checkAdLoading();
        }, 2000);
    }

    checkAdLoading() {
        try {
            var adContainers = document.querySelectorAll('.ad-container');

            for (var i = 0; i < adContainers.length; i++) {
                var container = adContainers[i];

                // Check if the ad container has actual ad content (iframes, etc.)
                var hasAdContent = container.querySelector('iframe') ||
                                 container.querySelector('[data-ad-status]') ||
                                 container.querySelector('.adsbygoogle');

                if (hasAdContent) {
                    container.classList.add('ad-loaded');
                } else {
                    // Check again after another delay
                    var self = this;
                    setTimeout(function() {
                        var finalCheck = container.querySelector('iframe') ||
                                       container.querySelector('[data-ad-status]') ||
                                       container.querySelector('.adsbygoogle');

                        if (finalCheck) {
                            container.classList.add('ad-loaded');
                        } else {
                            container.style.display = 'none';
                        }
                    }, 3000);
                }
            }
        } catch (error) {
            console.error('Error checking ad loading:', error);
        }
    }

    checkForSharedData() {
        try {
            var urlParams = new URLSearchParams(window.location.search);
            var shareParam = urlParams.get('share');

            if (shareParam) {
                try {
                    var shareData = JSON.parse(atob(shareParam));
                    this.showPasswordScreen(shareData);
                } catch (error) {
                    console.error('Error processing shared data:', error);
                    this.showNotification('Link chia sẻ không hợp lệ!', 'error');
                    // Redirect to clean URL after 2 seconds
                    setTimeout(function() {
                        window.location.href = window.location.pathname;
                    }, 2000);
                }
            }
        } catch (error) {
            console.error('Error checking for shared data:', error);
        }
    }

    showPasswordScreen(shareData) {
        try {
            this.sharedData = shareData;
            var passwordScreen = this.safeGetElement('passwordScreen');
            var sharePassword = this.safeGetElement('sharePassword');
            var appContainer = document.querySelector('.app-container');

            if (passwordScreen) passwordScreen.classList.add('show');
            if (sharePassword) sharePassword.focus();
            if (appContainer) appContainer.style.display = 'none';
        } catch (error) {
            console.error('Error showing password screen:', error);
        }
    }

    hidePasswordScreen() {
        try {
            var passwordScreen = this.safeGetElement('passwordScreen');
            var sharePassword = this.safeGetElement('sharePassword');
            var appContainer = document.querySelector('.app-container');

            if (passwordScreen) passwordScreen.classList.remove('show');
            if (sharePassword) sharePassword.value = '';
            if (appContainer) appContainer.style.display = 'block';
        } catch (error) {
            console.error('Error hiding password screen:', error);
        }
    }

    setupEventListeners() {
        try {
            // Calculate button
            var calculateBtn = this.safeGetElement('calculateBtn');
            if (calculateBtn) {
                calculateBtn.addEventListener('click', function() {
                    this.calculateSalary();
                }.bind(this));
            }

            // Reset button
            var resetBtn = this.safeGetElement('resetBtn');
            if (resetBtn) {
                resetBtn.addEventListener('click', function() {
                    this.resetForm();
                }.bind(this));
            }

            // Share button
            var shareBtn = this.safeGetElement('shareBtn');
            if (shareBtn) {
                shareBtn.addEventListener('click', function() {
                    this.showShareModal();
                }.bind(this));
            }

            // Theme toggle
            var themeToggle = this.safeGetElement('themeToggle');
            if (themeToggle) {
                themeToggle.addEventListener('click', function() {
                    this.toggleTheme();
                }.bind(this));
            }

            // Modal events
            var closeShareModal = this.safeGetElement('closeShareModal');
            if (closeShareModal) {
                closeShareModal.addEventListener('click', function() {
                    this.hideShareModal();
                }.bind(this));
            }

            var generateShareLinkBtn = this.safeGetElement('generateShareLinkBtn');
            if (generateShareLinkBtn) {
                generateShareLinkBtn.addEventListener('click', function() {
                    this.generateShareLink();
                }.bind(this));
            }

            var copyLinkBtn = this.safeGetElement('copyLinkBtn');
            if (copyLinkBtn) {
                copyLinkBtn.addEventListener('click', function() {
                    this.copyShareLink();
                }.bind(this));
            }

            // Auto-save on input change
            var inputs = document.querySelectorAll('.form-input');
            for (var i = 0; i < inputs.length; i++) {
                inputs[i].addEventListener('input', function() {
                    this.saveToLocalStorage();
                    this.formatMoneyInputs();
                }.bind(this));
            }

            // Close modal when clicking outside
            var shareModal = this.safeGetElement('shareModal');
            if (shareModal) {
                shareModal.addEventListener('click', function(e) {
                    if (e.target === shareModal) {
                        this.hideShareModal();
                    }
                }.bind(this));
            }

            // Password screen events
            var sharePassword = this.safeGetElement('sharePassword');
            if (sharePassword) {
                sharePassword.addEventListener('keypress', function(e) {
                    if (e.key === 'Enter') {
                        this.unlockSharedData();
                    }
                }.bind(this));
            }
        } catch (error) {
            console.error('Error setting up event listeners:', error);
        }
    }

    setupTheme() {
        try {
            var savedTheme = localStorage.getItem('salaryCalculatorTheme') || 'light';
            var themeToggle = this.safeGetElement('themeToggle');

            if (savedTheme === 'dark') {
                document.body.classList.add('dark-theme');
                if (themeToggle) themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
            }
        } catch (error) {
            console.error('Error setting up theme:', error);
        }
    }

    toggleTheme() {
        try {
            var isDark = document.body.classList.toggle('dark-theme');
            localStorage.setItem('salaryCalculatorTheme', isDark ? 'dark' : 'light');

            var themeToggle = this.safeGetElement('themeToggle');
            if (themeToggle) {
                var themeIcon = themeToggle.querySelector('i');
                if (themeIcon) {
                    themeIcon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
                }
            }
        } catch (error) {
            console.error('Error toggling theme:', error);
        }
    }

    formatMoneyInputs() {
        try {
            var moneyInputs = document.querySelectorAll('.form-input[type="text"]');
            for (var i = 0; i < moneyInputs.length; i++) {
                var input = moneyInputs[i];
                if (input.id === 'basicSalary' || input.id === 'allowance' || input.id === 'otherIncome' || input.id === 'unionFee') {
                    var value = input.value;

                    // Chỉ xử lý nếu có giá trị
                    if (value !== '' && value !== null && value !== undefined) {
                        // Loại bỏ tất cả ký tự không phải số
                        var numericString = String(value).replace(/[^\d]/g, '');

                        if (numericString !== '') {
                            var numericValue = parseInt(numericString, 10);

                            // Kiểm tra giá trị hợp lệ
                            if (!isNaN(numericValue) && numericValue >= 0) {
                                // Format với locale Việt Nam
                                var formattedValue = numericValue.toLocaleString('vi-VN');
                                input.value = formattedValue;
                            } else {
                                input.value = '';
                            }
                        } else {
                            input.value = '';
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error formatting money inputs:', error);
        }
    }

    parseMoneyValue(value) {
        if (value === null || value === undefined || value === '') {
            return 0;
        }

        // Đảm bảo value là string trước khi xử lý
        var stringValue = String(value);

        // Loại bỏ tất cả ký tự không phải số
        var numericString = stringValue.replace(/[^\d]/g, '');

        if (numericString === '') {
            return 0;
        }

        // Parse sang số với validation nghiêm ngặt
        var numericValue = parseInt(numericString, 10);

        // Kiểm tra nếu parseInt trả về NaN hoặc không phải số hợp lệ
        if (isNaN(numericValue) || numericValue < 0) {
            console.warn('Invalid money value:', value, 'parsed as:', numericValue, 'returning 0');
            return 0;
        }

        return numericValue;
    }

    calculateHourlyRate(basicSalary) {
        console.log('DEBUG: calculateHourlyRate called with basicSalary:', basicSalary);

        // Tính tiền 1 giờ làm việc: Lương cơ bản / số ngày làm việc / 8 giờ
        var workingDays = parseInt(this.safeGetValue('workingDays', '26')) || 26;
        console.log('DEBUG: workingDays:', workingDays);

        // Đảm bảo workingDays không phải 0 hoặc âm
        if (workingDays <= 0 || isNaN(workingDays)) {
            workingDays = 26; // Giá trị mặc định
            console.warn('Invalid working days, using default: 26');
        }

        // Đảm bảo basicSalary hợp lệ
        if (basicSalary <= 0 || isNaN(basicSalary)) {
            console.warn('Invalid basic salary for hourly rate calculation');
            return 0;
        }

        // Tính toán với các bước riêng biệt để tránh lỗi Safari
        var daysDivided = basicSalary / workingDays;
        console.log('DEBUG: daysDivided:', daysDivided);
        if (isNaN(daysDivided)) {
            console.warn('Days division resulted in NaN:', basicSalary, '/', workingDays);
            return 0;
        }

        var hoursDivided = daysDivided / 8;
        console.log('DEBUG: hoursDivided:', hoursDivided);
        if (isNaN(hoursDivided)) {
            console.warn('Hours division resulted in NaN:', daysDivided, '/', 8);
            return 0;
        }

        var roundedResult = Math.round(hoursDivided);
        console.log('DEBUG: roundedResult:', roundedResult);
        if (isNaN(roundedResult)) {
            console.warn('Rounding resulted in NaN:', hoursDivided);
            return 0;
        }

        console.log('DEBUG: calculateHourlyRate returning:', roundedResult);
        return roundedResult;
    }

    calculateOvertimeSalary() {
        try {
            var basicSalary = this.parseMoneyValue(this.safeGetValue('basicSalary', '0'));
            var hourlyRate = this.calculateHourlyRate(basicSalary);

            // Kiểm tra hourlyRate hợp lệ
            if (hourlyRate <= 0 || isNaN(hourlyRate)) {
                console.warn('Invalid hourly rate, returning zero overtime');
                return { totalOvertimeSalary: 0, overtimeDetails: [] };
            }

            var overtimeHours = {
                normalDay: parseFloat(this.safeGetValue('normalDayOvertime', '0')),
                normalNight: parseFloat(this.safeGetValue('normalNightOvertime', '0')),
                dayOff: parseFloat(this.safeGetValue('dayOffOvertime', '0')),
                nightDayOff: parseFloat(this.safeGetValue('nightDayOffOvertime', '0')),
                holiday: parseFloat(this.safeGetValue('holidayOvertime', '0')),
                nightHoliday: parseFloat(this.safeGetValue('nightHolidayOvertime', '0'))
            };

            var totalOvertimeSalary = 0;
            var overtimeDetails = [];
            var totalOvertimeHours = 0;

            for (var type in overtimeHours) {
                if (overtimeHours.hasOwnProperty(type)) {
                    var hours = overtimeHours[type];
                    if (hours > 0 && !isNaN(hours)) {
                        var rate = this.overtimeRates[type];
                        var salary = Math.round(hours * hourlyRate * rate);
                        totalOvertimeSalary += salary;
                        totalOvertimeHours += hours;

                        overtimeDetails.push({
                            type: this.getOvertimeTypeName(type),
                            hours: hours,
                            rate: rate,
                            salary: salary
                        });
                    }
                }
            }

            return { totalOvertimeSalary: totalOvertimeSalary, overtimeDetails: overtimeDetails, totalOvertimeHours: totalOvertimeHours };
        } catch (error) {
            console.error('Error calculating overtime salary:', error);
            return { totalOvertimeSalary: 0, overtimeDetails: [] };
        }
    }

    getOvertimeTypeName(type) {
        const names = {
            normalDay: 'Ngày thường (150%)',
            normalNight: 'Đêm thường (200%)',
            dayOff: 'Ngày nghỉ (200%)',
            nightDayOff: 'Đêm ngày nghỉ (270%)',
            holiday: 'Ngày lễ (300%)',
            nightHoliday: 'Đêm lễ (390%)'
        };
        return names[type] || type;
    }

    calculateNightShiftAllowance() {
        try {
            var nightShiftHours = parseFloat(this.safeGetValue('nightShiftHours', '0'));
            var basicSalary = this.parseMoneyValue(this.safeGetValue('basicSalary', '0'));
            var hourlyRate = this.calculateHourlyRate(basicSalary);

            // Kiểm tra các giá trị đầu vào với validation nghiêm ngặt hơn cho Safari
            if (typeof nightShiftHours !== 'number' || isNaN(nightShiftHours) || nightShiftHours < 0) {
                console.warn('Invalid night shift hours:', nightShiftHours, 'type:', typeof nightShiftHours);
                nightShiftHours = 0;
            }

            if (typeof hourlyRate !== 'number' || isNaN(hourlyRate) || hourlyRate <= 0) {
                console.warn('Invalid hourly rate for night shift calculation:', hourlyRate, 'type:', typeof hourlyRate);
                return 0;
            }

            // Đảm bảo nightShiftRate là số hợp lệ
            var nightShiftRate = typeof this.nightShiftRate === 'number' && !isNaN(this.nightShiftRate) ? this.nightShiftRate : 0.3;

            // Tính toán với các bước riêng biệt để tránh lỗi Safari
            var hoursMultiplied = nightShiftHours * hourlyRate;
            if (isNaN(hoursMultiplied)) {
                console.warn('Hours multiplication resulted in NaN:', nightShiftHours, '*', hourlyRate);
                return 0;
            }

            var rateMultiplied = hoursMultiplied * nightShiftRate;
            if (isNaN(rateMultiplied)) {
                console.warn('Rate multiplication resulted in NaN:', hoursMultiplied, '*', nightShiftRate);
                return 0;
            }

            var roundedResult = Math.round(rateMultiplied);
            if (isNaN(roundedResult)) {
                console.warn('Rounding resulted in NaN:', rateMultiplied);
                return 0;
            }

            return roundedResult;
        } catch (error) {
            console.error('Error calculating night shift allowance:', error);
            return 0;
        }
    }

    calculateInsurance() {
        try {
            var basicSalary = this.parseMoneyValue(this.safeGetValue('basicSalary', '0'));
            var allowance = this.parseMoneyValue(this.safeGetValue('allowance', '0'));

            // Bảo hiểm tính trên tổng lương cơ bản + phụ cấp
            var insuranceBase = basicSalary + allowance;

            var socialInsuranceRate = parseFloat(this.safeGetValue('socialInsurance', '8')) / 100 || 0.08;
            var healthInsuranceRate = parseFloat(this.safeGetValue('healthInsurance', '1.5')) / 100 || 0.015;
            var unemploymentInsuranceRate = parseFloat(this.safeGetValue('unemploymentInsurance', '1')) / 100 || 0.01;

            // Kiểm tra tỷ lệ hợp lệ
            if (isNaN(socialInsuranceRate) || socialInsuranceRate < 0) socialInsuranceRate = 0.08;
            if (isNaN(healthInsuranceRate) || healthInsuranceRate < 0) healthInsuranceRate = 0.015;
            if (isNaN(unemploymentInsuranceRate) || unemploymentInsuranceRate < 0) unemploymentInsuranceRate = 0.01;

            // Công đoàn cố định 40.000 VNĐ
            var unionFeeAmount = this.parseMoneyValue(this.safeGetValue('unionFee', '40000'));

            var socialInsAmount = Math.round(insuranceBase * socialInsuranceRate);
            var healthInsAmount = Math.round(insuranceBase * healthInsuranceRate);
            var unemploymentInsAmount = Math.round(insuranceBase * unemploymentInsuranceRate);
            var totalInsurance = socialInsAmount + healthInsAmount + unemploymentInsAmount;
            var totalDeductions = totalInsurance + unionFeeAmount;

            return {
                socialInsAmount: socialInsAmount,
                healthInsAmount: healthInsAmount,
                unemploymentInsAmount: unemploymentInsAmount,
                unionFeeAmount: unionFeeAmount,
                totalInsurance: totalInsurance,
                totalDeductions: totalDeductions
            };
        } catch (error) {
            console.error('Error calculating insurance:', error);
            return {
                socialInsAmount: 0,
                healthInsAmount: 0,
                unemploymentInsAmount: 0,
                unionFeeAmount: 40000,
                totalInsurance: 0,
                totalDeductions: 40000
            };
        }
    }

    calculateTax(taxableIncome) {
        try {
            // Áp dụng mức khởi điểm 11.4 triệu VNĐ và giảm trừ gia cảnh theo Luật Thuế TNCN mới nhất (2024)
            var taxFreeThreshold = 11400000; // Mức khởi điểm miễn thuế

            // Lấy số người phụ thuộc
            var dependents = parseInt(this.safeGetValue('dependents', '0'));

            // Kiểm tra dependents hợp lệ
            if (isNaN(dependents) || dependents < 0) {
                console.warn('Invalid dependents value:', dependents, 'setting to 0');
                dependents = 0;
            }

            // Tính giảm trừ gia cảnh: 11.4 triệu + 4.4 triệu/người phụ thuộc (theo Nghị định 125/2020/NĐ-CP)
            var familyDeduction = taxFreeThreshold + (dependents * 4400000);

            // Thu nhập chịu thuế thực tế (sau khi trừ giảm trừ gia cảnh)
            var actualTaxableIncome = Math.max(0, taxableIncome - familyDeduction);

            var tax = 0;
            var remainingIncome = actualTaxableIncome;

            // Áp dụng biểu thuế lũy tiến từng phần
            for (var i = 0; i < this.taxBrackets.length; i++) {
                var bracket = this.taxBrackets[i];
                if (remainingIncome <= 0) break;

                var taxableInBracket = Math.min(remainingIncome, bracket.max - bracket.min);
                tax += taxableInBracket * bracket.rate;
                remainingIncome -= taxableInBracket;
            }

            return {
                tax: Math.round(tax),
                familyDeduction: familyDeduction,
                actualTaxableIncome: actualTaxableIncome,
                dependents: dependents
            };
        } catch (error) {
            console.error('Error calculating tax:', error);
            return {
                tax: 0,
                familyDeduction: 11400000,
                actualTaxableIncome: Math.max(0, taxableIncome - 11400000),
                dependents: 0
            };
        }
    }

    calculateSalary() {
        try {
            // Get basic inputs
            var basicSalary = this.parseMoneyValue(this.safeGetValue('basicSalary', '0'));
            var allowance = this.parseMoneyValue(this.safeGetValue('allowance', '0'));
            var otherIncome = this.parseMoneyValue(this.safeGetValue('otherIncome', '0'));

            // Calculate components
            var basicTotal = basicSalary + allowance;
            var nightAllowance = this.calculateNightShiftAllowance();
            var overtimeResult = this.calculateOvertimeSalary();
            var totalOvertimeSalary = overtimeResult.totalOvertimeSalary;
            var overtimeDetails = overtimeResult.overtimeDetails;
            var totalOvertimeHours = overtimeResult.totalOvertimeHours || 0;
            var insurance = this.calculateInsurance();

            // Calculate hourly rate
            var hourlyRate = this.calculateHourlyRate(basicSalary);

            console.log('DEBUG: hourlyRate calculated:', hourlyRate, 'from basicSalary:', basicSalary);

            // Gross salary (before tax)
            var grossSalary = basicTotal + nightAllowance + totalOvertimeSalary + otherIncome;

            // Taxable income (gross salary - insurance deductions)
            var taxableIncome = grossSalary - insurance.totalInsurance;

            // Calculate tax with family deduction
            var taxResult = this.calculateTax(taxableIncome);

            // Net salary (after tax and all deductions)
            var netSalary = grossSalary - taxResult.tax - insurance.totalDeductions;

            // Update UI
            console.log('DEBUG: About to call updateResults with hourlyRate:', hourlyRate);
            this.updateResults({
                basicTotal: basicTotal,
                nightAllowance: nightAllowance,
                totalOvertimeSalary: totalOvertimeSalary,
                grossSalary: grossSalary,
                taxableIncome: taxableIncome,
                taxResult: taxResult,
                netSalary: netSalary,
                overtimeDetails: overtimeDetails,
                insurance: insurance,
                hourlyRate: hourlyRate,
                totalOvertimeHours: totalOvertimeHours
            });

            this.showNotification('Tính lương thành công!', 'success');

            // Recheck ad loading after calculation
            var self = this;
            setTimeout(function() {
                self.checkAdLoading();
            }, 500);

        } catch (error) {
            console.error('Calculation error:', error);
            this.showNotification('Có lỗi xảy ra khi tính lương!', 'error');
        }
    }

    updateResults(data) {
        try {
            console.log('DEBUG: updateResults called with data:', data);

            // Helper function để format số an toàn với validation nghiêm ngặt hơn
            var safeFormatNumber = function(num) {
                console.log('DEBUG: safeFormatNumber called with num:', num, 'type:', typeof num);
                if (typeof num !== 'number' || isNaN(num) || num === null || num === undefined) {
                    console.log('DEBUG: safeFormatNumber returning 0 for invalid num');
                    return '0';
                }
                var result = num.toLocaleString('vi-VN');
                console.log('DEBUG: safeFormatNumber returning:', result);
                return result;
            };

            // Update overtime details
            var overtimeDetailsEl = this.safeGetElement('overtimeDetails');
            if (overtimeDetailsEl) {
                overtimeDetailsEl.innerHTML = '';

                if (data.overtimeDetails.length > 0) {
                    for (var i = 0; i < data.overtimeDetails.length; i++) {
                        var detail = data.overtimeDetails[i];
                        if (detail && typeof detail === 'object') {
                            var detailEl = document.createElement('div');
                            detailEl.className = 'result-item';

                            var typeText = detail.type || 'Không xác định';
                            var hoursText = typeof detail.hours === 'number' && !isNaN(detail.hours) ? detail.hours : 0;
                            var salaryText = safeFormatNumber(detail.salary || 0);
                            var hourlyRateText = safeFormatNumber(data.hourlyRate * (detail.rate || 1));

                            detailEl.innerHTML = '<div class="overtime-detail"><span class="result-label">' + typeText + ' (' + hoursText + 'h):</span><span class="result-value">' + salaryText + ' VNĐ</span><span class="hourly-rate" title="Tiền theo giờ × Hệ số ' + ((detail.rate || 1) * 100) + '% = ' + hourlyRateText + ' VNĐ/h">(' + hourlyRateText + ' VNĐ/h)</span></div>';
                            overtimeDetailsEl.appendChild(detailEl);
                        }
                    }
                } else {
                    overtimeDetailsEl.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: var(--spacing-md); font-style: italic;">Không có giờ tăng ca</p>';
                }
            }

            // Update overtime summary với thông tin tiền theo giờ và tổng giờ
            console.log('DEBUG: About to update hourlyRate with data.hourlyRate:', data.hourlyRate);
            var formattedHourlyRate = safeFormatNumber(data.hourlyRate) + ' VNĐ/giờ';
            console.log('DEBUG: formattedHourlyRate:', formattedHourlyRate);
            this.safeSetText('hourlyRate', formattedHourlyRate);

            // Hiển thị tooltip với thông tin chi tiết về cách tính tiền theo giờ
            var hourlyRateElement = this.safeGetElement('hourlyRate');
            console.log('DEBUG: hourlyRateElement found:', hourlyRateElement);
            if (hourlyRateElement) {
                var basicSalary = this.parseMoneyValue(this.safeGetValue('basicSalary', '0'));
                var workingDays = parseInt(this.safeGetValue('workingDays', '26')) || 26;
                var hourlyRateTooltip = 'Lương cơ bản: ' + basicSalary.toLocaleString('vi-VN') + ' VNĐ ÷ ' + workingDays + ' ngày ÷ 8 giờ = ' + safeFormatNumber(data.hourlyRate) + ' VNĐ/giờ';
                hourlyRateElement.title = hourlyRateTooltip;
                console.log('DEBUG: Tooltip set:', hourlyRateTooltip);
            }

            this.safeSetText('totalOvertimeHours', (data.totalOvertimeHours || 0) + ' giờ');

            // Update summary với safe formatting
            this.safeSetText('basicTotal', safeFormatNumber(data.basicTotal) + ' VNĐ');
            this.safeSetText('nightAllowance', safeFormatNumber(data.nightAllowance) + ' VNĐ');
            this.safeSetText('totalOvertime', safeFormatNumber(data.totalOvertimeSalary) + ' VNĐ');
            this.safeSetText('grossSalary', safeFormatNumber(data.grossSalary) + ' VNĐ');
            this.safeSetText('totalDeductionsDisplay', safeFormatNumber(data.insurance.totalDeductions) + ' VNĐ');
            this.safeSetText('taxableSalary', safeFormatNumber(data.taxResult.actualTaxableIncome) + ' VNĐ');
            this.safeSetText('familyDeduction', safeFormatNumber(data.taxResult.familyDeduction) + ' VNĐ');
            this.safeSetText('dependentsCount', (data.taxResult.dependents || 0) + ' người');
            this.safeSetText('incomeTax', safeFormatNumber(data.taxResult.tax) + ' VNĐ');
            this.safeSetText('netSalary', safeFormatNumber(data.netSalary) + ' VNĐ');

            // Update insurance details
            this.safeSetText('socialInsAmount', safeFormatNumber(data.insurance.socialInsAmount) + ' VNĐ');
            this.safeSetText('healthInsAmount', safeFormatNumber(data.insurance.healthInsAmount) + ' VNĐ');
            this.safeSetText('unemploymentInsAmount', safeFormatNumber(data.insurance.unemploymentInsAmount) + ' VNĐ');
            this.safeSetText('unionFeeAmount', safeFormatNumber(data.insurance.unionFeeAmount) + ' VNĐ');
            this.safeSetText('totalDeductions', safeFormatNumber(data.insurance.totalDeductions) + ' VNĐ');

            // Show results section
            var resultsSection = this.safeGetElement('resultsSection');
            if (resultsSection) {
                resultsSection.style.display = 'block';

                // Scroll to results
                resultsSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }

            // Recheck ad loading for better user experience
            setTimeout(function() {
                this.checkAdLoading();
            }.bind(this), 1000);

        } catch (error) {
            console.error('Error in updateResults:', error);
            this.showNotification('Có lỗi xảy ra khi hiển thị kết quả!', 'error');
        }
    }

    resetForm() {
        try {
            // Reset to default values
            var elements = [
                'basicSalary', 'allowance', 'nightShiftHours', 'otherIncome',
                'normalDayOvertime', 'normalNightOvertime', 'dayOffOvertime',
                'nightDayOffOvertime', 'holidayOvertime', 'nightHolidayOvertime',
                'socialInsurance', 'healthInsurance', 'unemploymentInsurance',
                'unionFee', 'dependents', 'workingDays'
            ];

            for (var i = 0; i < elements.length; i++) {
                var id = elements[i];
                var element = this.safeGetElement(id);
                if (element) {
                    switch(id) {
                        case 'basicSalary':
                            element.value = '5000000';
                            break;
                        case 'allowance':
                            element.value = '1500000';
                            break;
                        case 'socialInsurance':
                            element.value = '8';
                            break;
                        case 'healthInsurance':
                            element.value = '1.5';
                            break;
                        case 'unemploymentInsurance':
                            element.value = '1';
                            break;
                        case 'unionFee':
                            element.value = '40000';
                            break;
                        case 'dependents':
                            element.value = '0';
                            break;
                        case 'workingDays':
                            element.value = '26';
                            break;
                        default:
                            element.value = '';
                    }
                }
            }

            // Reset overtime summary
            this.safeSetText('hourlyRate', '0 VNĐ/giờ');
            this.safeSetText('totalOvertimeHours', '0 giờ');

            // Hide results
            var resultsSection = this.safeGetElement('resultsSection');
            if (resultsSection) {
                resultsSection.style.display = 'none';
            }
            var adContainers = document.querySelectorAll('.ad-container');
            for (var j = 0; j < adContainers.length; j++) {
                var container = adContainers[j];
                container.classList.remove('ad-loaded');
                container.style.display = 'none';
            }

            this.saveToLocalStorage();
            this.formatMoneyInputs();
            this.showNotification('Đã khôi phục giá trị mặc định!', 'success');
        } catch (error) {
            console.error('Error resetting form:', error);
            this.showNotification('Có lỗi xảy ra khi khôi phục!', 'error');
        }
    }

    saveToLocalStorage() {
        try {
            var data = {
                basicSalary: this.parseMoneyValue(this.safeGetValue('basicSalary', '0')),
                allowance: this.parseMoneyValue(this.safeGetValue('allowance', '0')),
                nightShiftHours: this.safeGetValue('nightShiftHours', ''),
                otherIncome: this.parseMoneyValue(this.safeGetValue('otherIncome', '0')),
                normalDayOvertime: this.safeGetValue('normalDayOvertime', ''),
                normalNightOvertime: this.safeGetValue('normalNightOvertime', ''),
                dayOffOvertime: this.safeGetValue('dayOffOvertime', ''),
                nightDayOffOvertime: this.safeGetValue('nightDayOffOvertime', ''),
                holidayOvertime: this.safeGetValue('holidayOvertime', ''),
                nightHolidayOvertime: this.safeGetValue('nightHolidayOvertime', ''),
                socialInsurance: this.safeGetValue('socialInsurance', '8'),
                healthInsurance: this.safeGetValue('healthInsurance', '1.5'),
                unemploymentInsurance: this.safeGetValue('unemploymentInsurance', '1'),
                unionFee: this.parseMoneyValue(this.safeGetValue('unionFee', '40000')),
                dependents: this.safeGetValue('dependents', '0'),
                workingDays: this.safeGetValue('workingDays', '26')
            };

            // Validate data trước khi lưu
            for (var key in data) {
                if (data.hasOwnProperty(key)) {
                    var value = data[key];
                    if (value === null || value === undefined || value === '') {
                        if (key.includes('Overtime') || key === 'nightShiftHours') {
                            data[key] = 0;
                        } else if (key === 'dependents' || key === 'workingDays') {
                            data[key] = 0;
                        } else if (key.includes('Insurance')) {
                            data[key] = 0;
                        } else {
                            data[key] = 0;
                        }
                    }
                }
            }

            localStorage.setItem('salaryCalculatorData', JSON.stringify(data));
        } catch (error) {
            console.error('Error saving to localStorage:', error);
        }
    }

    loadFromLocalStorage() {
        try {
            var savedData = localStorage.getItem('salaryCalculatorData');
            if (savedData && typeof savedData === 'string') {
                var data = JSON.parse(savedData);

                // Kiểm tra data hợp lệ
                if (data && typeof data === 'object') {
                    for (var key in data) {
                        if (data.hasOwnProperty(key)) {
                            var element = this.safeGetElement(key);
                            if (element) {
                                var value = data[key];

                                if (key.indexOf('Salary') !== -1 || key.indexOf('Income') !== -1 || key === 'unionFee') {
                                    // Format money fields properly với validation nghiêm ngặt
                                    if (value !== null && value !== undefined && value !== '') {
                                        var stringValue = String(value);
                                        var numericString = stringValue.replace(/[^\d]/g, '');

                                        if (numericString !== '') {
                                            var numericValue = parseInt(numericString, 10);
                                            if (!isNaN(numericValue) && numericValue >= 0) {
                                                element.value = numericValue.toLocaleString('vi-VN');
                                            } else {
                                                element.value = '';
                                            }
                                        } else {
                                            element.value = '';
                                        }
                                    } else {
                                        element.value = '';
                                    }
                                } else {
                                    // Các trường khác
                                    if (value !== null && value !== undefined) {
                                        element.value = String(value);
                                    } else {
                                        element.value = '';
                                    }
                                }
                            }
                        }
                    }
                }

                this.formatMoneyInputs();
            }
        } catch (error) {
            console.error('Error loading saved data:', error);
            // Không hiển thị thông báo lỗi cho người dùng để tránh làm phiền
        }
    }

    showShareModal() {
        try {
            const shareModal = document.getElementById('shareModal');
            const modalPassword = document.getElementById('modalPassword');

            if (shareModal) shareModal.classList.add('show');
            if (modalPassword) modalPassword.focus();
        } catch (error) {
            console.error('Error showing share modal:', error);
        }
    }

    hideShareModal() {
        try {
            const shareModal = document.getElementById('shareModal');
            const modalPassword = document.getElementById('modalPassword');
            const shareLink = document.getElementById('shareLink');
            const linkSection = document.getElementById('linkSection');

            if (shareModal) shareModal.classList.remove('show');
            if (modalPassword) modalPassword.value = '';
            if (shareLink) shareLink.value = '';
            if (linkSection) linkSection.style.display = 'none';
        } catch (error) {
            console.error('Error hiding share modal:', error);
        }
    }

    generateShareLink() {
        try {
            var modalPassword = this.safeGetElement('modalPassword');
            var shareLink = this.safeGetElement('shareLink');
            var linkSection = this.safeGetElement('linkSection');

            if (!modalPassword) {
                this.showNotification('Không tìm thấy element mật khẩu!', 'error');
                return;
            }

            var password = modalPassword.value.trim();
            if (!password) {
                this.showNotification('Vui lòng nhập mật khẩu!', 'error');
                return;
            }

            // Get current form data với validation nghiêm ngặt
            var formData = {
                basicSalary: this.parseMoneyValue(this.safeGetValue('basicSalary', '0')),
                allowance: this.parseMoneyValue(this.safeGetValue('allowance', '0')),
                nightShiftHours: parseFloat(this.safeGetValue('nightShiftHours', '0')),
                otherIncome: this.parseMoneyValue(this.safeGetValue('otherIncome', '0')),
                normalDayOvertime: parseFloat(this.safeGetValue('normalDayOvertime', '0')),
                normalNightOvertime: parseFloat(this.safeGetValue('normalNightOvertime', '0')),
                dayOffOvertime: parseFloat(this.safeGetValue('dayOffOvertime', '0')),
                nightDayOffOvertime: parseFloat(this.safeGetValue('nightDayOffOvertime', '0')),
                holidayOvertime: parseFloat(this.safeGetValue('holidayOvertime', '0')),
                nightHolidayOvertime: parseFloat(this.safeGetValue('nightHolidayOvertime', '0')),
                socialInsurance: parseFloat(this.safeGetValue('socialInsurance', '8')),
                healthInsurance: parseFloat(this.safeGetValue('healthInsurance', '1.5')),
                unemploymentInsurance: parseFloat(this.safeGetValue('unemploymentInsurance', '1')),
                unionFee: this.parseMoneyValue(this.safeGetValue('unionFee', '40000')),
                dependents: parseInt(this.safeGetValue('dependents', '0')),
                workingDays: parseInt(this.safeGetValue('workingDays', '26'))
            };

            // Validate formData trước khi mã hóa
            for (var key in formData) {
                if (formData.hasOwnProperty(key)) {
                    var value = formData[key];
                    if (typeof value !== 'number' || isNaN(value)) {
                        console.warn('Invalid value for', key, ':', value, 'setting to 0');
                        formData[key] = 0;
                    }
                }
            }

            // Create data object with password
            var shareData = {
                password: btoa(password), // Base64 encode password
                data: btoa(JSON.stringify(formData)), // Base64 encode form data
                timestamp: Date.now()
            };

            // Generate share URL
            var shareUrl = window.location.origin + window.location.pathname + '?share=' + btoa(JSON.stringify(shareData));

            if (shareLink) shareLink.value = shareUrl;
            if (linkSection) linkSection.style.display = 'block';

            this.showNotification('Đã tạo link chia sẻ!', 'success');

        } catch (error) {
            console.error('Error generating share link:', error);
            this.showNotification('Có lỗi xảy ra khi tạo link chia sẻ!', 'error');
        }
    }

    copyShareLink() {
        try {
            var shareLinkInput = this.safeGetElement('shareLink');
            if (!shareLinkInput) {
                this.showNotification('Không tìm thấy element link!', 'error');
                return;
            }

            shareLinkInput.select();
            shareLinkInput.setSelectionRange(0, 99999); // For mobile devices

            try {
                document.execCommand('copy');
                this.showNotification('Đã sao chép link!', 'success');
            } catch (error) {
                // Fallback for modern browsers
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(shareLinkInput.value).then(function() {
                        this.showNotification('Đã sao chép link!', 'success');
                    }.bind(this)).catch(function() {
                        this.showNotification('Không thể sao chép link!', 'error');
                    }.bind(this));
                } else {
                    this.showNotification('Không thể sao chép link!', 'error');
                }
            }
        } catch (error) {
            console.error('Error copying share link:', error);
            this.showNotification('Có lỗi xảy ra khi sao chép link!', 'error');
        }
    }

    showNotification(message, type) {
        try {
            if (type === undefined) type = 'info';
            var notification = this.safeGetElement('notification');
            if (notification) {
                notification.textContent = message;
                notification.className = 'notification show ' + type;

                // Auto-hide after 3 seconds
                var self = this;
                setTimeout(function() {
                    var notif = self.safeGetElement('notification');
                    if (notif) {
                        notif.classList.remove('show');
                    }
                }, 3000);
            } else {
                console.warn('Notification element not found');
            }
        } catch (error) {
            console.error('Error showing notification:', error);
        }
    }

    // Password protection functions
    unlockSharedData() {
        try {
            var sharePassword = this.safeGetElement('sharePassword');
            if (!sharePassword) {
                this.showNotification('Không tìm thấy element mật khẩu!', 'error');
                return;
            }

            var password = sharePassword.value.trim();
            if (!password) {
                this.showNotification('Vui lòng nhập mật khẩu!', 'error');
                return;
            }

            if (btoa(password) === this.sharedData.password) {
                // Password correct, load shared data
                var formData = JSON.parse(atob(this.sharedData.data));

                // Fill form with shared data với validation nghiêm ngặt
                for (var key in formData) {
                    if (formData.hasOwnProperty(key)) {
                        var element = this.safeGetElement(key);
                        if (element) {
                            var value = formData[key];

                            if (key.indexOf('Salary') !== -1 || key.indexOf('Income') !== -1 || key === 'unionFee') {
                                // Format money fields properly với validation nghiêm ngặt
                                if (value !== null && value !== undefined && value !== '') {
                                    var stringValue = String(value);
                                    var numericString = stringValue.replace(/[^\d]/g, '');

                                    if (numericString !== '') {
                                        var numericValue = parseInt(numericString, 10);
                                        if (!isNaN(numericValue) && numericValue >= 0) {
                                            element.value = numericValue.toLocaleString('vi-VN');
                                        } else {
                                            element.value = '';
                                        }
                                    } else {
                                        element.value = '';
                                    }
                                } else {
                                    element.value = '';
                                }
                            } else {
                                // Các trường khác
                                if (value !== null && value !== undefined) {
                                    element.value = String(value);
                                } else {
                                    element.value = '';
                                }
                            }
                        }
                    }
                }

                // Hide password screen and show calculator
                this.hidePasswordScreen();

                // Calculate and show results
                this.calculateSalary();

                // Remove share parameter from URL
                var url = new URL(window.location);
                url.searchParams.delete('share');
                window.history.replaceState({}, '', url);

                this.showNotification('Đã mở khóa thành công!', 'success');

                // Check ads after loading shared data
                var self = this;
                setTimeout(function() {
                    self.checkAdLoading();
                }, 1500);

            } else {
                this.showNotification('Mật khẩu không đúng!', 'error');
                if (sharePassword) sharePassword.value = '';
            }
        } catch (error) {
            console.error('Error unlocking shared data:', error);
            this.showNotification('Có lỗi xảy ra khi mở khóa!', 'error');
        }
    }

    goHome() {
        // Hide ad containers when going home
        try {
            var adContainers = document.querySelectorAll('.ad-container');
            for (var i = 0; i < adContainers.length; i++) {
                var container = adContainers[i];
                container.classList.remove('ad-loaded');
                container.style.display = 'none';
            }
        } catch (error) {
            console.error('Error hiding ad containers:', error);
        }

        // Redirect to clean URL
        window.location.href = window.location.pathname;
    }

    goHome() {
        // Hide ad containers when going home
        try {
            var adContainers = document.querySelectorAll('.ad-container');
            for (var i = 0; i < adContainers.length; i++) {
                var container = adContainers[i];
                container.classList.remove('ad-loaded');
                container.style.display = 'none';
            }
        } catch (error) {
            console.error('Error hiding ad containers:', error);
        }

        // Redirect to clean URL
        window.location.href = window.location.pathname;
    }
}

// Global functions for HTML onclick handlers
var salaryCalculator;

function unlockSharedData() {
    if (salaryCalculator) {
        salaryCalculator.unlockSharedData();
    }
}

function goHome() {
    if (salaryCalculator) {
        salaryCalculator.goHome();
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    try {
        salaryCalculator = new SalaryCalculator();

        // Setup AdSense after a short delay to ensure DOM is ready
        setTimeout(function() {
            if (salaryCalculator && salaryCalculator.setupAdSense) {
                salaryCalculator.setupAdSense();
            }
        }, 100);
    } catch (error) {
        console.error('Error initializing application:', error);
    }
});
