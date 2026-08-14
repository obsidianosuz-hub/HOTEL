const test = async () => {
    try {
        const login = await fetch('http://localhost:5001/api/staff/login', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({email: 'housekeeping1', password: 'password123'})
        });
        const loginText = await login.text();
        let token;
        try {
            const loginData = JSON.parse(loginText);
            token = loginData.token;
        } catch(e) {}
        
        if (token) {
            const res = await fetch('http://localhost:5001/api/housekeeping/rooms', {
                headers: { Authorization: 'Bearer ' + token }
            });
            console.log('Status:', res.status);
            const text = await res.text();
            console.log('Data:', text);
        } else {
            console.log("No token", loginText)
        }
    } catch (e) {
        console.error('Error:', e);
    }
}
test();
