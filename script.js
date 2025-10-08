// Salary Calculator with Vietnamese locale support
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

        // Tax brackets for Vietnamese income tax
        this.taxBrackets = [
            { min: 0, max: 5000000, rate: 0.05 },      // 5%
            { min: 5000000, max: 10000000, rate: 0.10 }, // 10%
            { min: 10000000, max: 18000000, rate: 0.15 }, // 15%
            { min: 18000000, max: 32000000, rate: 0.20 }, // 20%
            { min: 32000000, max: 52000000, rate: 0.25 }, // 25%
            { min: 52000000, max: 80000000, rate: 0.30 }, // 30%
            { min: 80000000, max: Infinity, rate: 0.35 }  // 35%
        ];

        this.init();
    }

    init() {
        this.loadFromLocalStorage();
        this.setupEventListeners();
        this.setupTheme();
        this.formatMoneyInputs();
    }

    setupEventListeners() {
        // Calculate button
        document.getElementById('calculateBtn').addEventListener('click', () => {
            this.calculateSalary();
        });

        // Reset button
        document.getElementById('resetBtn').addEventListener('click', () => {
            this.resetForm();
        });

        // Share button
        document.getElementById('shareBtn').addEventListener('click', () => {
            this.showShareModal();
        });

        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => {
            this.toggleTheme();
        });

        // Modal events
        document.getElementById('closeShareModal').addEventListener('click', () => {
            this.hideShareModal();
        });

        document.getElementById('generateShareLinkBtn').addEventListener('click', () => {
            this.generateShareLink();
        });

        document.getElementById('copyLinkBtn').addEventListener('click', () => {
            this.copyShareLink();
        });

        // Auto-save on input change
        const inputs = document.querySelectorAll('.form-input');
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                this.saveToLocalStorage();
                this.formatMoneyInputs();
            });
        });

        // Close modal when clicking outside
        document.getElementById('shareModal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('shareModal')) {
                this.hideShareModal();
            }
        });
    }

    setupTheme() {
        const savedTheme = localStorage.getItem('salaryCalculatorTheme') || 'light';
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-theme');
            document.getElementById('themeToggle').innerHTML = '<i class="fas fa-sun"></i>';
        }
    }

    toggleTheme() {
        const isDark = document.body.classList.toggle('dark-theme');
        localStorage.setItem('salaryCalculatorTheme', isDark ? 'dark' : 'light');

        const themeIcon = document.getElementById('themeToggle').querySelector('i');
        themeIcon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
    }

    formatMoneyInputs() {
        const moneyInputs = document.querySelectorAll('.money-input');
        moneyInputs.forEach(input => {
            let value = input.value.replace(/[^\d]/g, '');
            if (value) {
                value = parseInt(value).toLocaleString('vi-VN');
                input.value = value;
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
        const basicSalary = this.parseMoneyValue(document.getElementById('basicSalary').value);
        const hourlyRate = this.calculateHourlyRate(basicSalary);

        const overtimeHours = {
            normalDay: parseFloat(document.getElementById('normalDayOvertime').value) || 0,
            normalNight: parseFloat(document.getElementById('normalNightOvertime').value) || 0,
            dayOff: parseFloat(document.getElementById('dayOffOvertime').value) || 0,
            nightDayOff: parseFloat(document.getElementById('nightDayOffOvertime').value) || 0,
            holiday: parseFloat(document.getElementById('holidayOvertime').value) || 0,
            nightHoliday: parseFloat(document.getElementById('nightHolidayOvertime').value) || 0
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
        const nightShiftHours = parseFloat(document.getElementById('nightShiftHours').value) || 0;
        const basicSalary = this.parseMoneyValue(document.getElementById('basicSalary').value);
        const hourlyRate = this.calculateHourlyRate(basicSalary);

        return Math.round(nightShiftHours * hourlyRate * this.nightShiftRate);
    }

    calculateInsurance() {
        const basicSalary = this.parseMoneyValue(document.getElementById('basicSalary').value);
        const allowance = this.parseMoneyValue(document.getElementById('allowance').value);

        // Bảo hiểm tính trên tổng lương cơ bản + phụ cấp
        const insuranceBase = basicSalary + allowance;

        const socialInsuranceRate = parseFloat(document.getElementById('socialInsurance').value) / 100 || 0.08;
        const healthInsuranceRate = parseFloat(document.getElementById('healthInsurance').value) / 100 || 0.015;
        const unemploymentInsuranceRate = parseFloat(document.getElementById('unemploymentInsurance').value) / 100 || 0.01;

        const socialInsAmount = Math.round(insuranceBase * socialInsuranceRate);
        const healthInsAmount = Math.round(insuranceBase * healthInsuranceRate);
        const unemploymentInsAmount = Math.round(insuranceBase * unemploymentInsuranceRate);
        const totalInsurance = socialInsAmount + healthInsAmount + unemploymentInsAmount;

        return {
            socialInsAmount,
            healthInsAmount,
            unemploymentInsAmount,
            totalInsurance
        };
    }

    calculateTax(taxableIncome) {
        let tax = 0;
        let remainingIncome = taxableIncome;

        for (const bracket of this.taxBrackets) {
            if (remainingIncome <= 0) break;

            const taxableInBracket = Math.min(remainingIncome, bracket.max - bracket.min);
            tax += taxableInBracket * bracket.rate;
            remainingIncome -= taxableInBracket;
        }

        return Math.round(tax);
    }

    calculateSalary() {
        try {
            // Get basic inputs
            const basicSalary = this.parseMoneyValue(document.getElementById('basicSalary').value);
            const allowance = this.parseMoneyValue(document.getElementById('allowance').value);
            const otherIncome = this.parseMoneyValue(document.getElementById('otherIncome').value);

            // Calculate components
            const basicTotal = basicSalary + allowance;
            const nightAllowance = this.calculateNightShiftAllowance();
            const { totalOvertimeSalary, overtimeDetails } = this.calculateOvertimeSalary();
            const insurance = this.calculateInsurance();

            // Gross salary (before tax)
            const grossSalary = basicTotal + nightAllowance + totalOvertimeSalary + otherIncome;

            // Taxable income (gross salary - insurance deductions)
            const taxableIncome = grossSalary - insurance.totalInsurance;

            // Calculate tax
            const incomeTax = this.calculateTax(taxableIncome);

            // Net salary (after tax and insurance)
            const netSalary = grossSalary - incomeTax - insurance.totalInsurance;

            // Update UI
            this.updateResults({
                basicTotal,
                nightAllowance,
                totalOvertimeSalary,
                grossSalary,
                taxableIncome,
                incomeTax,
                netSalary,
                overtimeDetails,
                insurance
            });

            this.showNotification('Tính lương thành công!', 'success');

        } catch (error) {
            console.error('Calculation error:', error);
            this.showNotification('Có lỗi xảy ra khi tính lương!', 'error');
        }
    }

    updateResults(data) {
        // Update overtime details
        const overtimeDetailsEl = document.getElementById('overtimeDetails');
        overtimeDetailsEl.innerHTML = '';

        if (data.overtimeDetails.length > 0) {
            data.overtimeDetails.forEach(detail => {
                const detailEl = document.createElement('div');
                detailEl.className = 'result-item';
                detailEl.innerHTML = `
                    <span class="label">${detail.type} (${detail.hours}h):</span>
                    <span class="value">${detail.salary.toLocaleString('vi-VN')} VNĐ</span>
                `;
                overtimeDetailsEl.appendChild(detailEl);
            });
        } else {
            overtimeDetailsEl.innerHTML = '<p style="color: var(--light-text-secondary); text-align: center; padding: 1rem;">Không có giờ tăng ca</p>';
        }

        // Update summary
        document.getElementById('basicTotal').textContent = `${data.basicTotal.toLocaleString('vi-VN')} VNĐ`;
        document.getElementById('nightAllowance').textContent = `${data.nightAllowance.toLocaleString('vi-VN')} VNĐ`;
        document.getElementById('totalOvertime').textContent = `${data.totalOvertimeSalary.toLocaleString('vi-VN')} VNĐ`;
        document.getElementById('grossSalary').textContent = `${data.grossSalary.toLocaleString('vi-VN')} VNĐ`;
        document.getElementById('taxableSalary').textContent = `${data.taxableIncome.toLocaleString('vi-VN')} VNĐ`;
        document.getElementById('incomeTax').textContent = `${data.incomeTax.toLocaleString('vi-VN')} VNĐ`;
        document.getElementById('netSalary').textContent = `${data.netSalary.toLocaleString('vi-VN')} VNĐ`;

        // Update insurance details
        document.getElementById('socialInsAmount').textContent = `${data.insurance.socialInsAmount.toLocaleString('vi-VN')} VNĐ`;
        document.getElementById('healthInsAmount').textContent = `${data.insurance.healthInsAmount.toLocaleString('vi-VN')} VNĐ`;
        document.getElementById('unemploymentInsAmount').textContent = `${data.insurance.unemploymentInsAmount.toLocaleString('vi-VN')} VNĐ`;
        document.getElementById('totalInsurance').textContent = `${data.insurance.totalInsurance.toLocaleString('vi-VN')} VNĐ`;

        // Show results section
        document.getElementById('resultsSection').style.display = 'block';

        // Scroll to results
        document.getElementById('resultsSection').scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }

    resetForm() {
        // Reset to default values
        document.getElementById('basicSalary').value = '5000000';
        document.getElementById('allowance').value = '1500000';
        document.getElementById('nightShiftHours').value = '';
        document.getElementById('otherIncome').value = '0';

        // Reset overtime hours
        document.getElementById('normalDayOvertime').value = '';
        document.getElementById('normalNightOvertime').value = '';
        document.getElementById('dayOffOvertime').value = '';
        document.getElementById('nightDayOffOvertime').value = '';
        document.getElementById('holidayOvertime').value = '';
        document.getElementById('nightHolidayOvertime').value = '';

        // Reset insurance rates
        document.getElementById('socialInsurance').value = '8';
        document.getElementById('healthInsurance').value = '1.5';
        document.getElementById('unemploymentInsurance').value = '1';

        // Hide results
        document.getElementById('resultsSection').style.display = 'none';

        this.saveToLocalStorage();
        this.formatMoneyInputs();
        this.showNotification('Đã khôi phục giá trị mặc định!', 'success');
    }

    saveToLocalStorage() {
        const data = {
            basicSalary: document.getElementById('basicSalary').value,
            allowance: document.getElementById('allowance').value,
            nightShiftHours: document.getElementById('nightShiftHours').value,
            otherIncome: document.getElementById('otherIncome').value,
            normalDayOvertime: document.getElementById('normalDayOvertime').value,
            normalNightOvertime: document.getElementById('normalNightOvertime').value,
            dayOffOvertime: document.getElementById('dayOffOvertime').value,
            nightDayOffOvertime: document.getElementById('nightDayOffOvertime').value,
            holidayOvertime: document.getElementById('holidayOvertime').value,
            nightHolidayOvertime: document.getElementById('nightHolidayOvertime').value,
            socialInsurance: document.getElementById('socialInsurance').value,
            healthInsurance: document.getElementById('healthInsurance').value,
            unemploymentInsurance: document.getElementById('unemploymentInsurance').value
        };

        localStorage.setItem('salaryCalculatorData', JSON.stringify(data));
    }

    loadFromLocalStorage() {
        const savedData = localStorage.getItem('salaryCalculatorData');
        if (savedData) {
            try {
                const data = JSON.parse(savedData);

                Object.keys(data).forEach(key => {
                    const element = document.getElementById(key);
                    if (element) {
                        element.value = data[key];
                    }
                });

                this.formatMoneyInputs();
            } catch (error) {
                console.error('Error loading saved data:', error);
            }
        }
    }

    showShareModal() {
        document.getElementById('shareModal').classList.add('show');
        document.getElementById('sharePassword').focus();
    }

    hideShareModal() {
        document.getElementById('shareModal').classList.remove('show');
        document.getElementById('sharePassword').value = '';
        document.getElementById('shareLink').value = '';
    }

    generateShareLink() {
        const password = document.getElementById('sharePassword').value.trim();
        if (!password) {
            this.showNotification('Vui lòng nhập mật khẩu!', 'error');
            return;
        }

        // Get current form data
        const formData = {
            basicSalary: this.parseMoneyValue(document.getElementById('basicSalary').value),
            allowance: this.parseMoneyValue(document.getElementById('allowance').value),
            nightShiftHours: parseFloat(document.getElementById('nightShiftHours').value) || 0,
            otherIncome: this.parseMoneyValue(document.getElementById('otherIncome').value),
            normalDayOvertime: parseFloat(document.getElementById('normalDayOvertime').value) || 0,
            normalNightOvertime: parseFloat(document.getElementById('normalNightOvertime').value) || 0,
            dayOffOvertime: parseFloat(document.getElementById('dayOffOvertime').value) || 0,
            nightDayOffOvertime: parseFloat(document.getElementById('nightDayOffOvertime').value) || 0,
            holidayOvertime: parseFloat(document.getElementById('holidayOvertime').value) || 0,
            nightHolidayOvertime: parseFloat(document.getElementById('nightHolidayOvertime').value) || 0,
            socialInsurance: parseFloat(document.getElementById('socialInsurance').value) || 8,
            healthInsurance: parseFloat(document.getElementById('healthInsurance').value) || 1.5,
            unemploymentInsurance: parseFloat(document.getElementById('unemploymentInsurance').value) || 1
        };

        // Create data object with password
        const shareData = {
            password: btoa(password), // Base64 encode password
            data: btoa(JSON.stringify(formData)), // Base64 encode form data
            timestamp: Date.now()
        };

        // Generate share URL
        const shareUrl = `${window.location.origin}${window.location.pathname}?share=${btoa(JSON.stringify(shareData))}`;

        document.getElementById('shareLink').value = shareUrl;
        this.showNotification('Đã tạo link chia sẻ!', 'success');
    }

    copyShareLink() {
        const shareLinkInput = document.getElementById('shareLink');
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
    }

    showNotification(message, type = 'info') {
        const notification = document.getElementById('notification');
        notification.textContent = message;
        notification.className = `notification show ${type}`;

        // Auto-hide after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
}

// URL parameter handling for shared links
function handleSharedData() {
    const urlParams = new URLSearchParams(window.location.search);
    const shareParam = urlParams.get('share');

    if (shareParam) {
        try {
            const shareData = JSON.parse(atob(shareParam));

            // Show password prompt
            const password = prompt('Nhập mật khẩu để xem thông tin chia sẻ:');
            if (password && btoa(password) === shareData.password) {
                const formData = JSON.parse(atob(shareData.data));

                // Fill form with shared data
                Object.keys(formData).forEach(key => {
                    const element = document.getElementById(key);
                    if (element) {
                        if (key.includes('Salary') || key.includes('Income')) {
                            element.value = formData[key].toLocaleString('vi-VN');
                        } else {
                            element.value = formData[key];
                        }
                    }
                });

                // Calculate and show results
                const calculator = new SalaryCalculator();
                calculator.calculateSalary();

                // Remove share parameter from URL
                urlParams.delete('share');
                const newUrl = `${window.location.pathname}${urlParams.toString() ? '?' + urlParams.toString() : ''}`;
                window.history.replaceState({}, '', newUrl);

            } else {
                alert('Mật khẩu không đúng!');
                window.location.href = window.location.pathname;
            }
        } catch (error) {
            console.error('Error processing shared data:', error);
            alert('Link chia sẻ không hợp lệ!');
            window.location.href = window.location.pathname;
        }
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new SalaryCalculator();
    handleSharedData();
});
