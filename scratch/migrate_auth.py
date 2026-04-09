import os
import re

api_dir = 'app/api'

replacement_rules = [
    (r"import \{ getServerSession \} from 'next-auth'", "import { getSupabaseUser } from '@/lib/auth-server'"),
    (r"import \{ authOptions \} from '@/lib/auth'", ""),
    (r"await getServerSession\(authOptions\)", "await getSupabaseUser(req)"),
    (r"export async function GET\(\)", "export async function GET(req: NextRequest)"),
    (r"export async function POST\(\)", "export async function POST(req: NextRequest)"),
    (r"export async function PUT\(\)", "export async function PUT(req: NextRequest)"),
    (r"export async function DELETE\(\)", "export async function DELETE(req: NextRequest)"),
    (r"session\?\.user\?\.id", "user?.id"),
    (r"session\.user\.id", "user.id"),
    (r"const session = await", "const user = await"),
    (r"if \(!session", "if (!user")
]

for root, dirs, files in os.walk(api_dir):
    for file in files:
        if file == 'route.ts':
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            new_content = content
            for pattern, subst in replacement_rules:
                new_content = re.sub(pattern, subst, new_content)
            
            if new_content != content:
                # Add NextRequest import if missing and used
                if 'NextRequest' in new_content and 'NextRequest' not in content:
                    if 'import { NextResponse }' in new_content:
                        new_content = new_content.replace('import { NextResponse }', 'import { NextRequest, NextResponse }')
                    elif 'import { NextResponse, ' in new_content:
                         new_content = new_content.replace('import { NextResponse, ', 'import { NextRequest, NextResponse, ')

                with open(path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"Fixed: {path}")
