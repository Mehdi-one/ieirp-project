// Mock Server for Testing IEIRP Frontend
// Run this with: node mock-server.js

const http = require('http');
const url = require('url');

const mockCategories = [
    { id: 1, name: "Forest Fire", description: "Reports related to forest fires and wildfire incidents" },
    { id: 2, name: "Snow-blocked Road", description: "Roads blocked due to snow or ice accumulation" },
    { id: 3, name: "Water Issue", description: "Water contamination, shortage, or flooding issues" },
    { id: 4, name: "Infrastructure Damage", description: "Damage to roads, buildings, bridges, and other infrastructure" },
    { id: 5, name: "Wildlife Incident", description: "Injured wildlife, animal sightings in urban areas" },
    { id: 6, name: "Air Pollution", description: "Air quality issues and pollution incidents" },
    { id: 7, name: "Waste Management", description: "Illegal dumping, waste collection issues" },
    { id: 8, name: "Noise Pollution", description: "Excessive noise from construction, traffic, or other sources" }
];

const mockUsers = [
    { id: 1, name: "System Administrator", email: "admin@ieirp.com", role: "ADMIN" },
    { id: 2, name: "Test Citizen", email: "citizen@test.com", role: "CITIZEN" },
    { id: 3, name: "Test Authority", email: "authority@test.com", role: "AUTHORITY" }
];

const mockIncidents = [
    {
        id: 1,
        category: { id: 1, name: "Forest Fire" },
        user: { id: 2, name: "Test Citizen", email: "citizen@test.com" },
        location: "Ifrane National Park",
        description: "Small fire detected near hiking trail area",
        status: "REPORTED",
        latitude: 33.533331,
        longitude: -5.166667,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        id: 2,
        category: { id: 2, name: "Snow-blocked Road" },
        user: { id: 2, name: "Test Citizen", email: "citizen@test.com" },
        location: "Route 13 near Ifrane",
        description: "Heavy snow accumulation blocking main highway",
        status: "UNDER_REVIEW",
        latitude: 33.540000,
        longitude: -5.150000,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    }
];

const server = http.createServer((req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    
    // Categories endpoint
    if (pathname === '/api/categories') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(mockCategories));
        return;
    }
    
    // Auth endpoints
    if (pathname === '/api/auth/login') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            const loginData = JSON.parse(body);
            const user = mockUsers.find(u => u.email === loginData.email);
            
            if (user && loginData.password === 'password123') {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    token: 'mock-jwt-token-' + Date.now(),
                    type: 'Bearer',
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role
                }));
            } else {
                res.writeHead(401, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid credentials' }));
            }
        });
        return;
    }
    
    if (pathname === '/api/auth/register') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            const userData = JSON.parse(body);
            const newUser = {
                id: mockUsers.length + 1,
                ...userData,
                role: 'CITIZEN'
            };
            mockUsers.push(newUser);
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                message: 'User registered successfully',
                userId: newUser.id,
                email: newUser.email,
                role: newUser.role
            }));
        });
        return;
    }
    
    if (pathname === '/api/auth/me') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            id: 1,
            email: "admin@ieirp.com",
            name: "System Administrator",
            role: "ADMIN"
        }));
        return;
    }
    
    // Incidents endpoints
    if (pathname === '/api/incidents/my') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(mockIncidents.filter(i => i.user.email === 'citizen@test.com')));
        return;
    }
    
    if (pathname === '/api/incidents') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(mockIncidents));
        return;
    }
    
    if (pathname.startsWith('/api/incidents/')) {
        const id = parseInt(pathname.split('/')[3]);
        const incident = mockIncidents.find(i => i.id === id);
        
        if (incident) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(incident));
        } else {
            res.writeHead(404);
            res.end();
        }
        return;
    }
    
    // Stats endpoint
    if (pathname === '/api/incidents/stats') {
        const stats = {
            reported: mockIncidents.filter(i => i.status === 'REPORTED').length,
            underReview: mockIncidents.filter(i => i.status === 'UNDER_REVIEW').length,
            inProgress: mockIncidents.filter(i => i.status === 'IN_PROGRESS').length,
            resolved: mockIncidents.filter(i => i.status === 'RESOLVED').length,
            rejected: mockIncidents.filter(i => i.status === 'REJECTED').length
        };
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(stats));
        return;
    }
    
    // Default response
    res.writeHead(404);
    res.end('Not Found');
});

const PORT = 8080;
server.listen(PORT, () => {
    console.log(`Mock IEIRP server running on http://localhost:${PORT}`);
    console.log('Test credentials:');
    console.log('  Admin: admin@ieirp.com / password123');
    console.log('  Citizen: citizen@test.com / password123');
    console.log('  Authority: authority@test.com / password123');
});
