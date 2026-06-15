const fs = require('fs');
const path = require('path');

const dashboardPath = path.join(__dirname, '../src/app/(dashboard)');

const files = [
  'deliveries/page.tsx',
  'disputes/page.tsx',
  'food-orders/page.tsx',
  'food-vendors/page.tsx',
  'marketing/coupons/page.tsx',
  'marketing/flash-sales/page.tsx',
  'moderation/reels/page.tsx',
  'moderation/reviews/page.tsx',
  'orders/page.tsx',
  'referrals/page.tsx',
  'service-bookings/page.tsx',
  'service-vendors/page.tsx',
  'users/page.tsx'
];

files.forEach(file => {
  const filePath = path.join(dashboardPath, file);
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Skip if already has Pagination
  if (content.includes('<Pagination')) return;
  
  // Add import
  if (!content.includes('import { Pagination }')) {
    content = content.replace(
      'import { DashboardLayout }',
      'import { Pagination } from "../../../components/ui/Pagination";\nimport { DashboardLayout }'
    );
  }
  
  // Try to find the data variable name. Usually it's response
  // e.g. const { data: response, isLoading } = useOrders({ page, limit });
  // or const { data: usersResponse, isLoading } = useUsers(page, limit);
  // or const { data: deliveries, isLoading } = useDeliveries(page, limit);
  
  const paginationHtml = `
            {!isLoading && (
              <Pagination
                page={page}
                totalPages={response?.meta?.lastPage || response?.meta?.totalPages || 1}
                total={response?.meta?.total || 0}
                onPageChange={setPage}
              />
            )}
          </CardContent>`;
          
  // For users, orders, disputes they had old pagination
  if (content.includes('Previous</button>')) {
    // Remove old pagination block (approximate regex)
    content = content.replace(/\{\/\* Pagination Controls \*\/\}.*?<\/div>\n\s*\}\)/s, '');
    content = content.replace(/\{!isLoading && totalPages > 1 && \([\s\S]*?<\/div>\n\s*\)\}/s, '');
  }

  content = content.replace('</CardContent>', paginationHtml);
  
  fs.writeFileSync(filePath, content);
  console.log('Updated', file);
});
