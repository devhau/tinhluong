// Enhanced Salary Calculator with Vietnamese locale support
class SalaryCalculator {
    constructor() {
        this.nightShiftRate = 0.3; // 30% phụ cấp đêm
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

    setupAdSense() {
        // AdSense callback functions
        window.adsbygoogle = window.adsbygoogle || [];
        const adsbygoogle = window.adsbygoogle;

        // Push ad with callback to handle loading state
        adsbygoogle.push({
            google_ad_client: "ca-pub-7587631210958149",
            enable_page_level_ads: true
        });

        // Set up simple ad loading detection after a delay
        setTimeout(() => {
            this.checkAdLoading();
        }, 2000);
    }

    checkAdLoading() {
        const adContainers = document.querySelectorAll('.ad-container');

        adContainers.forEach(container => {
            // Check if the ad container has actual ad content (iframes, etc.)
            const hasAdContent = container.querySelector('iframe') ||
                               container.querySelector('[data-ad-status]') ||
                               container.querySelector('.adsbygoogle');

            if (hasAdContent) {
                container.classList.add('ad-loaded');
            } else {
                // Check again after another delay
                setTimeout(() => {
                    const finalCheck = container.querySelector('iframe') ||
                                    container.querySelector('[data-ad-status]') ||
                                    container.querySelector('.adsbygoogle');

                    if (finalCheck) {
                        container.classList.add('ad-loaded');
                    } else {
                        container.style.display = 'none';
                    }
                }, 3000);
            }
        });
    }

    checkForSharedData() {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const shareParam = urlParams.get('share');

            if (shareParam) {
                try {
                    const shareData = JSON.parse(atob(shareParam));
                    this.showPasswordScreen(shareData);
                } catch (error) {
                    console.error('Error processing shared data:', error);
                    this.showNotification('Link chia sẻ không hợp lệ!', 'error');
                    // Redirect to clean URL after 2 seconds
                    setTimeout(() => {
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
            const passwordScreen = document.getElementById('passwordScreen');
            const sharePassword = document.getElementById('sharePassword');
            const appContainer = document.querySelector('.app-container');

            if (passwordScreen) passwordScreen.classList.add('show');
            if (sharePassword) sharePassword.focus();
            if (appContainer) appContainer.style.display = 'none';
        } catch (error) {
            console.error('Error showing password screen:', error);
        }
    }

    hidePasswordScreen() {
        try {
            const passwordScreen = document.getElementById('passwordScreen');
            const sharePassword = document.getElementById('sharePassword');
            const appContainer = document.querySelector('.app-container');

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
            const calculateBtn = document.getElementById('calculateBtn');
            if (calculateBtn) {
                calculateBtn.addEventListener('click', () => {
                    this.calculateSalary();
                });
            }

            // Reset button
            const resetBtn = document.getElementById('resetBtn');
            if (resetBtn) {
                resetBtn.addEventListener('click', () => {
                    this.resetForm();
                });
            }

            // Share button
            const shareBtn = document.getElementById('shareBtn');
            if (shareBtn) {
                shareBtn.addEventListener('click', () => {
                    this.showShareModal();
                });
            }

            // Theme toggle
            const themeToggle = document.getElementById('themeToggle');
            if (themeToggle) {
                themeToggle.addEventListener('click', () => {
                    this.toggleTheme();
                });
            }

            // Modal events
            const closeShareModal = document.getElementById('closeShareModal');
            if (closeShareModal) {
                closeShareModal.addEventListener('click', () => {
                    this.hideShareModal();
                });
            }

            const generateShareLinkBtn = document.getElementById('generateShareLinkBtn');
            if (generateShareLinkBtn) {
                generateShareLinkBtn.addEventListener('click', () => {
                    this.generateShareLink();
                });
            }

            const copyLinkBtn = document.getElementById('copyLinkBtn');
            if (copyLinkBtn) {
                copyLinkBtn.addEventListener('click', () => {
                    this.copyShareLink();
                });
            }

            // Auto-save on input change
            const inputs = document.querySelectorAll('.form-input');
            inputs.forEach(input => {
                input.addEventListener('input', () => {
                    this.saveToLocalStorage();
                    this.formatMoneyInputs();
                });
            });

            // Close modal when clicking outside
            const shareModal = document.getElementById('shareModal');
            if (shareModal) {
                shareModal.addEventListener('click', (e) => {
                    if (e.target === shareModal) {
                        this.hideShareModal();
                    }
                });
            }

            // Password screen events
            const sharePassword = document.getElementById('sharePassword');
            if (sharePassword) {
                sharePassword.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        this.unlockSharedData();
                    }
                });
            }
        } catch (error) {
            console.error('Error setting up event listeners:', error);
        }
    }

    setupTheme() {
        try {
            const savedTheme = localStorage.getItem('salaryCalculatorTheme') || 'light';
            const themeToggle = document.getElementById('themeToggle');

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
            const isDark = document.body.classList.toggle('dark-theme');
            localStorage.setItem('salaryCalculatorTheme', isDark ? 'dark' : 'light');

            const themeToggle = document.getElementById('themeToggle');
            if (themeToggle) {
                const themeIcon = themeToggle.querySelector('i');
                if (themeIcon) {
                    themeIcon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
                }
            }
        } catch (error) {
            console.error('Error toggling theme:', error);
        }
    }

    formatMoneyInputs() {
        const moneyInputs = document.querySelectorAll('.form-input[type="text"]');
        moneyInputs.forEach(input => {
            if (input.id === 'basicSalary' || input.id === 'allowance' || input.id === 'otherIncome' || input.id === 'unionFee') {
                let value = input.value.replace(/[^\d]/g, '');
                if (value) {
                    value = parseInt(value).toLocaleString('vi-VN');
                    input.value = value;
                }
            }
        });
    }

    parseMoneyValue(value) {
        return parseInt(value.replace(/[^\d]/g, '')) || 0;
    }

    calculateHourlyRate(basicSalary) {
        // Tính tiền 1 giờ làm việc: Lương cơ bản / 26 ngày / 8 giờ
        return Math.round(basicSalary / this.workingDays / 8);
    }

    calculateOvertimeSalary() {
        try {
            const basicSalary = this.parseMoneyValue(document.getElementById('basicSalary')?.value || '0');
            const hourlyRate = this.calculateHourlyRate(basicSalary);

            const overtimeHours = {
                normalDay: parseFloat(document.getElementById('normalDayOvertime')?.value) || 0,
                normalNight: parseFloat(document.getElementById('normalNightOvertime')?.value) || 0,
                dayOff: parseFloat(document.getElementById('dayOffOvertime')?.value) || 0,
                nightDayOff: parseFloat(document.getElementById('nightDayOffOvertime')?.value) || 0,
                holiday: parseFloat(document.getElementById('holidayOvertime')?.value) || 0,
                nightHoliday: parseFloat(document.getElementById('nightHolidayOvertime')?.value) || 0
            };

            let totalOvertimeSalary = 0;
            const overtimeDetails = [];

            for (const [type, hours] of Object.entries(overtimeHours)) {
                if (hours > 0) {
                    const rate = this.overtimeRates[type];
                    const salary = Math.round(hours * hourlyRate * rate);
                    totalOvertimeSalary += salary;

                    overtimeDetails.push({
                        type: this.getOvertimeTypeName(type),
                        hours: hours,
                        rate: rate,
                        salary: salary
                    });
                }
            }

            return { totalOvertimeSalary, overtimeDetails };
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
            const nightShiftHours = parseFloat(document.getElementById('nightShiftHours')?.value) || 0;
            const basicSalary = this.parseMoneyValue(document.getElementById('basicSalary')?.value || '0');
            const hourlyRate = this.calculateHourlyRate(basicSalary);

            return Math.round(nightShiftHours * hourlyRate * this.nightShiftRate);
        } catch (error) {
            console.error('Error calculating night shift allowance:', error);
            return 0;
        }
    }

    calculateInsurance() {
        try {
            const basicSalary = this.parseMoneyValue(document.getElementById('basicSalary')?.value || '0');
            const allowance = this.parseMoneyValue(document.getElementById('allowance')?.value || '0');

            // Bảo hiểm tính trên tổng lương cơ bản + phụ cấp
            const insuranceBase = basicSalary + allowance;

            const socialInsuranceRate = parseFloat(document.getElementById('socialInsurance')?.value) / 100 || 0.08;
            const healthInsuranceRate = parseFloat(document.getElementById('healthInsurance')?.value) / 100 || 0.015;
            const unemploymentInsuranceRate = parseFloat(document.getElementById('unemploymentInsurance')?.value) / 100 || 0.01;

            // Công đoàn cố định 40.000 VNĐ
            const unionFeeAmount = this.parseMoneyValue(document.getElementById('unionFee')?.value) || 40000;

            const socialInsAmount = Math.round(insuranceBase * socialInsuranceRate);
            const healthInsAmount = Math.round(insuranceBase * healthInsuranceRate);
            const unemploymentInsAmount = Math.round(insuranceBase * unemploymentInsuranceRate);
            const totalInsurance = socialInsAmount + healthInsAmount + unemploymentInsAmount;
            const totalDeductions = totalInsurance + unionFeeAmount;

            return {
                socialInsAmount,
                healthInsAmount,
                unemploymentInsAmount,
                unionFeeAmount,
                totalInsurance,
                totalDeductions
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
            const taxFreeThreshold = 11400000; // Mức khởi điểm miễn thuế

            // Lấy số người phụ thuộc
            const dependents = parseInt(document.getElementById('dependents')?.value) || 0;

            // Tính giảm trừ gia cảnh: 11.4 triệu + 4.4 triệu/người phụ thuộc (theo Nghị định 125/2020/NĐ-CP)
            const familyDeduction = taxFreeThreshold + (dependents * 4400000);

            // Thu nhập chịu thuế thực tế (sau khi trừ giảm trừ gia cảnh)
            const actualTaxableIncome = Math.max(0, taxableIncome - familyDeduction);

            let tax = 0;
            let remainingIncome = actualTaxableIncome;

            // Áp dụng biểu thuế lũy tiến từng phần
            for (const bracket of this.taxBrackets) {
                if (remainingIncome <= 0) break;

                const taxableInBracket = Math.min(remainingIncome, bracket.max - bracket.min);
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
            const basicSalary = this.parseMoneyValue(document.getElementById('basicSalary')?.value || '0');
            const allowance = this.parseMoneyValue(document.getElementById('allowance')?.value || '0');
            const otherIncome = this.parseMoneyValue(document.getElementById('otherIncome')?.value || '0');

            // Calculate components
            const basicTotal = basicSalary + allowance;
            const nightAllowance = this.calculateNightShiftAllowance();
            const { totalOvertimeSalary, overtimeDetails } = this.calculateOvertimeSalary();
            const insurance = this.calculateInsurance();

            // Gross salary (before tax)
            const grossSalary = basicTotal + nightAllowance + totalOvertimeSalary + otherIncome;

            // Taxable income (gross salary - insurance deductions)
            const taxableIncome = grossSalary - insurance.totalInsurance;

            // Calculate tax with family deduction
            const taxResult = this.calculateTax(taxableIncome);

            // Net salary (after tax and all deductions)
            const netSalary = grossSalary - taxResult.tax - insurance.totalDeductions;

            // Update UI
            this.updateResults({
                basicTotal,
                nightAllowance,
                totalOvertimeSalary,
                grossSalary,
                taxableIncome,
                taxResult,
                netSalary,
                overtimeDetails,
                insurance
            });

            this.showNotification('Tính lương thành công!', 'success');

            // Recheck ad loading after calculation
            setTimeout(() => {
                this.checkAdLoading();
            }, 500);

        } catch (error) {
            console.error('Calculation error:', error);
            this.showNotification('Có lỗi xảy ra khi tính lương!', 'error');
        }
    }

    updateResults(data) {
        try {
            // Safe DOM element access helper
            const safeGetElement = (id) => {
                return document.getElementById(id);
            };

            const safeSetText = (id, text) => {
                const element = safeGetElement(id);
                if (element) {
                    element.textContent = text;
                } else {
                    console.warn(`Element with id '${id}' not found`);
                }
            };

            // Update overtime details
            const overtimeDetailsEl = safeGetElement('overtimeDetails');
            if (overtimeDetailsEl) {
                overtimeDetailsEl.innerHTML = '';

                if (data.overtimeDetails.length > 0) {
                    data.overtimeDetails.forEach(detail => {
                        const detailEl = document.createElement('div');
                        detailEl.className = 'result-item';
                        detailEl.innerHTML = `
                            <span class="result-label">${detail.type} (${detail.hours}h):</span>
                            <span class="result-value">${detail.salary.toLocaleString('vi-VN')} VNĐ</span>
                        `;
                        overtimeDetailsEl.appendChild(detailEl);
                    });
                } else {
                    overtimeDetailsEl.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: var(--spacing-md); font-style: italic;">Không có giờ tăng ca</p>';
                }
            }

            // Update summary
            safeSetText('basicTotal', `${data.basicTotal.toLocaleString('vi-VN')} VNĐ`);
            safeSetText('nightAllowance', `${data.nightAllowance.toLocaleString('vi-VN')} VNĐ`);
            safeSetText('totalOvertime', `${data.totalOvertimeSalary.toLocaleString('vi-VN')} VNĐ`);
            safeSetText('grossSalary', `${data.grossSalary.toLocaleString('vi-VN')} VNĐ`);
            safeSetText('totalDeductionsDisplay', `${data.insurance.totalDeductions.toLocaleString('vi-VN')} VNĐ`);
            safeSetText('taxableSalary', `${data.taxResult.actualTaxableIncome.toLocaleString('vi-VN')} VNĐ`);
            safeSetText('familyDeduction', `${data.taxResult.familyDeduction.toLocaleString('vi-VN')} VNĐ`);
            safeSetText('dependentsCount', `${data.taxResult.dependents} người`);
            safeSetText('incomeTax', `${data.taxResult.tax.toLocaleString('vi-VN')} VNĐ`);
            safeSetText('netSalary', `${data.netSalary.toLocaleString('vi-VN')} VNĐ`);

            // Update insurance details
            safeSetText('socialInsAmount', `${data.insurance.socialInsAmount.toLocaleString('vi-VN')} VNĐ`);
            safeSetText('healthInsAmount', `${data.insurance.healthInsAmount.toLocaleString('vi-VN')} VNĐ`);
            safeSetText('unemploymentInsAmount', `${data.insurance.unemploymentInsAmount.toLocaleString('vi-VN')} VNĐ`);
            safeSetText('unionFeeAmount', `${data.insurance.unionFeeAmount.toLocaleString('vi-VN')} VNĐ`);
            safeSetText('totalDeductions', `${data.insurance.totalDeductions.toLocaleString('vi-VN')} VNĐ`);

            // Show results section
            const resultsSection = safeGetElement('resultsSection');
            if (resultsSection) {
                resultsSection.style.display = 'block';

                // Scroll to results
                resultsSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }

            // Recheck ad loading for better user experience
            setTimeout(() => {
                this.checkAdLoading();
            }, 1000);

        } catch (error) {
            console.error('Error in updateResults:', error);
            this.showNotification('Có lỗi xảy ra khi hiển thị kết quả!', 'error');
        }
    }

    resetForm() {
        try {
            // Reset to default values
            const elements = [
                'basicSalary', 'allowance', 'nightShiftHours', 'otherIncome',
                'normalDayOvertime', 'normalNightOvertime', 'dayOffOvertime',
                'nightDayOffOvertime', 'holidayOvertime', 'nightHolidayOvertime',
                'socialInsurance', 'healthInsurance', 'unemploymentInsurance',
                'unionFee', 'dependents'
            ];

            elements.forEach(id => {
                const element = document.getElementById(id);
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
                        default:
                            element.value = '';
                    }
                }
            });

            // Hide results
            const resultsSection = document.getElementById('resultsSection');
            if (resultsSection) {
                resultsSection.style.display = 'none';
            }

            // Hide ad containers
            const adContainers = document.querySelectorAll('.ad-container');
            adContainers.forEach(container => {
                container.classList.remove('ad-loaded');
                container.style.display = 'none';
            });

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
            const data = {
                basicSalary: this.parseMoneyValue(document.getElementById('basicSalary')?.value || '0'),
                allowance: this.parseMoneyValue(document.getElementById('allowance')?.value || '0'),
                nightShiftHours: document.getElementById('nightShiftHours')?.value || '',
                otherIncome: this.parseMoneyValue(document.getElementById('otherIncome')?.value || '0'),
                normalDayOvertime: document.getElementById('normalDayOvertime')?.value || '',
                normalNightOvertime: document.getElementById('normalNightOvertime')?.value || '',
                dayOffOvertime: document.getElementById('dayOffOvertime')?.value || '',
                nightDayOffOvertime: document.getElementById('nightDayOffOvertime')?.value || '',
                holidayOvertime: document.getElementById('holidayOvertime')?.value || '',
                nightHolidayOvertime: document.getElementById('nightHolidayOvertime')?.value || '',
                socialInsurance: document.getElementById('socialInsurance')?.value || '8',
                healthInsurance: document.getElementById('healthInsurance')?.value || '1.5',
                unemploymentInsurance: document.getElementById('unemploymentInsurance')?.value || '1',
                unionFee: this.parseMoneyValue(document.getElementById('unionFee')?.value || '40000'),
                dependents: document.getElementById('dependents')?.value || '0'
            };

            localStorage.setItem('salaryCalculatorData', JSON.stringify(data));
        } catch (error) {
            console.error('Error saving to localStorage:', error);
        }
    }

    loadFromLocalStorage() {
        try {
            const savedData = localStorage.getItem('salaryCalculatorData');
            if (savedData) {
                const data = JSON.parse(savedData);

                Object.keys(data).forEach(key => {
                    const element = document.getElementById(key);
                    if (element) {
                        if (key.includes('Salary') || key.includes('Income') || key === 'unionFee') {
                            // Format money fields properly
                            const numericValue = parseInt(data[key].replace(/[^\d]/g, '')) || 0;
                            element.value = numericValue.toLocaleString('vi-VN');
                        } else {
                            element.value = data[key];
                        }
                    }
                });

                this.formatMoneyInputs();
            }
        } catch (error) {
            console.error('Error loading saved data:', error);
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
            const modalPassword = document.getElementById('modalPassword');
            const shareLink = document.getElementById('shareLink');
            const linkSection = document.getElementById('linkSection');

            if (!modalPassword) {
                this.showNotification('Không tìm thấy element mật khẩu!', 'error');
                return;
            }

            const password = modalPassword.value.trim();
            if (!password) {
                this.showNotification('Vui lòng nhập mật khẩu!', 'error');
                return;
            }

            // Get current form data
            const formData = {
                basicSalary: this.parseMoneyValue(document.getElementById('basicSalary')?.value || '0'),
                allowance: this.parseMoneyValue(document.getElementById('allowance')?.value || '0'),
                nightShiftHours: parseFloat(document.getElementById('nightShiftHours')?.value) || 0,
                otherIncome: this.parseMoneyValue(document.getElementById('otherIncome')?.value || '0'),
                normalDayOvertime: parseFloat(document.getElementById('normalDayOvertime')?.value) || 0,
                normalNightOvertime: parseFloat(document.getElementById('normalNightOvertime')?.value) || 0,
                dayOffOvertime: parseFloat(document.getElementById('dayOffOvertime')?.value) || 0,
                nightDayOffOvertime: parseFloat(document.getElementById('nightDayOffOvertime')?.value) || 0,
                holidayOvertime: parseFloat(document.getElementById('holidayOvertime')?.value) || 0,
                nightHolidayOvertime: parseFloat(document.getElementById('nightHolidayOvertime')?.value) || 0,
                socialInsurance: parseFloat(document.getElementById('socialInsurance')?.value) || 8,
                healthInsurance: parseFloat(document.getElementById('healthInsurance')?.value) || 1.5,
                unemploymentInsurance: parseFloat(document.getElementById('unemploymentInsurance')?.value) || 1,
                unionFee: this.parseMoneyValue(document.getElementById('unionFee')?.value || '40000'),
                dependents: parseInt(document.getElementById('dependents')?.value) || 0
            };

            // Create data object with password
            const shareData = {
                password: btoa(password), // Base64 encode password
                data: btoa(JSON.stringify(formData)), // Base64 encode form data
                timestamp: Date.now()
            };

            // Generate share URL
            const shareUrl = `${window.location.origin}${window.location.pathname}?share=${btoa(JSON.stringify(shareData))}`;

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
            const shareLinkInput = document.getElementById('shareLink');
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
                navigator.clipboard.writeText(shareLinkInput.value).then(() => {
                    this.showNotification('Đã sao chép link!', 'success');
                }).catch(() => {
                    this.showNotification('Không thể sao chép link!', 'error');
                });
            }
        } catch (error) {
            console.error('Error copying share link:', error);
            this.showNotification('Có lỗi xảy ra khi sao chép link!', 'error');
        }
    }

    showNotification(message, type = 'info') {
        try {
            const notification = document.getElementById('notification');
            if (notification) {
                notification.textContent = message;
                notification.className = `notification show ${type}`;

                // Auto-hide after 3 seconds
                setTimeout(() => {
                    if (notification) {
                        notification.classList.remove('show');
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
            const sharePassword = document.getElementById('sharePassword');
            if (!sharePassword) {
                this.showNotification('Không tìm thấy element mật khẩu!', 'error');
                return;
            }

            const password = sharePassword.value.trim();
            if (!password) {
                this.showNotification('Vui lòng nhập mật khẩu!', 'error');
                return;
            }

            if (btoa(password) === this.sharedData.password) {
                // Password correct, load shared data
                const formData = JSON.parse(atob(this.sharedData.data));

                // Fill form with shared data
                Object.keys(formData).forEach(key => {
                    const element = document.getElementById(key);
                    if (element) {
                        if (key.includes('Salary') || key.includes('Income') || key === 'unionFee') {
                            // Format money fields properly
                            const numericValue = parseInt(formData[key].toString().replace(/[^\d]/g, '')) || 0;
                            element.value = numericValue.toLocaleString('vi-VN');
                        } else {
                            element.value = formData[key];
                        }
                    }
                });

                // Hide password screen and show calculator
                this.hidePasswordScreen();

                // Calculate and show results
                this.calculateSalary();

                // Remove share parameter from URL
                const url = new URL(window.location);
                url.searchParams.delete('share');
                window.history.replaceState({}, '', url);

                this.showNotification('Đã mở khóa thành công!', 'success');

                // Check ads after loading shared data
                setTimeout(() => {
                    this.checkAdLoading();
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
        const adContainers = document.querySelectorAll('.ad-container');
        adContainers.forEach(container => {
            container.classList.remove('ad-loaded');
            container.style.display = 'none';
        });

        // Redirect to clean URL
        window.location.href = window.location.pathname;
    }
}

// Global functions for HTML onclick handlers
let salaryCalculator;

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
document.addEventListener('DOMContentLoaded', () => {
    salaryCalculator = new SalaryCalculator();

    // Setup AdSense after a short delay to ensure DOM is ready
    setTimeout(() => {
        if (salaryCalculator && salaryCalculator.setupAdSense) {
            salaryCalculator.setupAdSense();
        }
    }, 100);
});
