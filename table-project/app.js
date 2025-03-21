class DataTable {
    constructor(tableId, options = {}) {
        this.table = document.getElementById(tableId);
        this.data = [];
        this.currentPage = 1;
        this.pageSize = options.pageSize || 10;
        this.sortField = null;
        this.sortOrder = 0; // 0:默认 1:升序 2:降序
        this.filterText = '';
        this.init();
    }

    init() {
        // 初始化数据
        this.data = this.generateSampleData(100);
        this.renderTable();
        this.setupEventListeners();
    }

    generateSampleData(count) {
        const departments = ['研发部', '市场部', '财务部', '人事部'];
        const positions = ['工程师', '经理', '总监', '专员'];
        const data = [];
        
        for (let i = 1; i <= count; i++) {
            data.push({
                id: i,
                name: `员工${i}`,
                position: positions[Math.floor(Math.random() * positions.length)],
                department: departments[Math.floor(Math.random() * departments.length)],
                salary: Math.floor(Math.random() * 20000) + 8000
            });
        }
        return data;
    }

    get filteredData() {
        let data = [...this.data];
        
        // 过滤
        if (this.filterText) {
            const searchText = this.filterText.toLowerCase();
            data = data.filter(item => 
                Object.values(item).some(value => 
                    String(value).toLowerCase().includes(searchText)
                )
            );
        }

        // 排序
        if (this.sortField && this.sortOrder !== 0) {
            data.sort((a, b) => {
                if (a[this.sortField] < b[this.sortField]) return this.sortOrder === 1 ? -1 : 1;
                if (a[this.sortField] > b[this.sortField]) return this.sortOrder === 1 ? 1 : -1;
                return 0;
            });
        }

        return data;
    }

    get paginatedData() {
        const start = (this.currentPage - 1) * this.pageSize;
        const end = start + this.pageSize;
        return this.filteredData.slice(start, end);
    }

    renderTable() {
        const tbody = this.table.querySelector('tbody');
        tbody.innerHTML = '';

        this.paginatedData.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.name}</td>
                <td>${item.position}</td>
                <td>${item.department}</td>
                <td>¥${item.salary.toLocaleString()}</td>
            `;
            tbody.appendChild(row);
        });

        this.updatePagination();
    }

    updatePagination() {
        const totalPages = Math.ceil(this.filteredData.length / this.pageSize);
        const pageInfo = document.getElementById('page-info');
        pageInfo.textContent = `第 ${this.currentPage} 页，共 ${totalPages} 页`;

        const prevBtn = document.getElementById('prev');
        const nextBtn = document.getElementById('next');
        prevBtn.disabled = this.currentPage === 1;
        nextBtn.disabled = this.currentPage === totalPages;
    }

    setupEventListeners() {
        // 搜索
        document.getElementById('search').addEventListener('input', (e) => {
            this.filterText = e.target.value.trim();
            this.currentPage = 1;
            this.renderTable();
        });

        // 排序
        document.getElementById('sort').addEventListener('change', (e) => {
            this.sortOrder = parseInt(e.target.value);
            this.renderTable();
        });

        // 表头排序
        this.table.querySelectorAll('th[data-sort]').forEach(th => {
            th.addEventListener('click', () => {
                this.sortField = th.dataset.sort;
                this.renderTable();
            });
        });

        // 分页
        document.getElementById('prev').addEventListener('click', () => {
            if (this.currentPage > 1) {
                this.currentPage--;
                this.renderTable();
            }
        });

        document.getElementById('next').addEventListener('click', () => {
            const totalPages = Math.ceil(this.filteredData.length / this.pageSize);
            if (this.currentPage < totalPages) {
                this.currentPage++;
                this.renderTable();
            }
        });
    }
}

// 初始化表格
new DataTable('data-table', { pageSize: 10 });
