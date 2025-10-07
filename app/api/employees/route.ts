import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getUserRole } from "@/lib/acl";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = await getUserRole(session.user.id, session.user.tenantId);
    const tenantId = session.user.tenantId;
    const pointId = session.user.pointId; // Get the currently active pointId from session

    if (!tenantId) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    const whereClause: any = { tenantId };

    // If the user is a Point, filter employees by their specific pointId
    if (userRole === "POINT" && pointId) {
      whereClause.pointId = pointId;
    }
    // If the user is a Partner, and has an active point selected, filter by that pointId
    else if (userRole === "PARTNER" && pointId) {
      whereClause.pointId = pointId;
    }
    // If Partner but no specific point selected, or Owner, show all employees in their tenant
    // This logic might need refinement based on exact requirements for Partner/Owner viewing all employees vs specific point employees
    // For now, if Partner and no pointId, it will show all employees for the tenant.
    // If Owner, it will show all employees for the tenant.

    const employees = await prisma.user.findMany({
      where: {
        ...whereClause,
        // Only fetch users who are employees (e.g., not Owners or Partners themselves)
        // This might need a more robust role check or a dedicated 'Employee' model
        UserRole: {
          some: {
            role: {
              name: {
                in: ["POINT", "Employee"] // Assuming 'Point' users are also considered employees of a point
              }
            }
          }
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        pointId: true,
        createdAt: true,
        point: {
          select: {
            id: true,
            name: true
          }
        },
        UserRole: {
          select: {
            id: true,
            roleId: true,
            tenantId: true,
            role: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: { name: "asc" }
    });

    const formattedEmployees = employees.map(employee => ({
      id: employee.id,
      name: employee.name || "Без имени",
      email: employee.email,
      phone: "+7 (999) 123-45-67", // TODO: Добавить поле телефона в схему
      position: "Сотрудник", // TODO: Добавить поле должности в схему
      department: employee.point?.name || "Не назначен",
      status: "active" as const,
      hireDate: employee.createdAt.toISOString(), // Преобразуем в ISO строку
      pointId: employee.pointId,
      pointName: employee.point?.name
    }));

    return NextResponse.json(formattedEmployees);

  } catch (error) {
    console.error("Error fetching employees:", error);
    return NextResponse.json({ error: "Failed to fetch employees" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = await getUserRole(session.user.id, session.user.tenantId);
    const tenantId = session.user.tenantId;
    const pointId = session.user.pointId;

    if (!tenantId) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    // Проверяем права на создание сотрудников
    if (userRole !== "OWNER" && userRole !== "PARTNER" && userRole !== "POINT") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await req.json();
    const { name, email, position, phone, status } = body;

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
    }

    // Проверяем, не существует ли уже пользователь с таким email
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 400 });
    }

    // Генерируем пароль по умолчанию
    const defaultPassword = "password123";
    const hashedPassword = await bcrypt.hash(defaultPassword, 12);

    // Определяем pointId для нового сотрудника
    let employeePointId = pointId;
    
    // Если пользователь - Owner, он может создавать сотрудников для любой точки в своем tenant
    if (userRole === "OWNER" && body.pointId) {
      employeePointId = body.pointId;
    }
    // Если пользователь - Partner, он может создавать сотрудников только для своих точек
    else if (userRole === "PARTNER" && pointId) {
      // Проверяем, что точка принадлежит партнеру
      const point = await prisma.point.findFirst({
        where: {
          id: pointId,
          tenantId: tenantId
        }
      });
      
      if (!point) {
        return NextResponse.json({ error: "Point not found or access denied" }, { status: 400 });
      }
    }
    // Если пользователь - Point, он может создавать сотрудников только для своей точки
    else if (userRole === "POINT" && pointId) {
      employeePointId = pointId;
    }

    // Создаем пользователя
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: hashedPassword,
        tenantId,
        pointId: employeePointId,
        isPlatformOwner: false
      }
    });

    // Получаем роль "POINT" (сотрудник)
    const pointRole = await prisma.role.findUnique({
      where: { name: "POINT" }
    });

    if (!pointRole) {
      return NextResponse.json({ error: "Point role not found" }, { status: 500 });
    }

    // Назначаем роль сотрудника
    await prisma.userRole.create({
      data: {
        userId: newUser.id,
        roleId: pointRole.id,
        tenantId
      }
    });

    // Возвращаем созданного сотрудника
    const createdEmployee = await prisma.user.findUnique({
      where: { id: newUser.id },
      select: {
        id: true,
        name: true,
        email: true,
        pointId: true,
        createdAt: true,
        point: {
          select: {
            id: true,
            name: true
          }
        },
        UserRole: {
          select: {
            id: true,
            roleId: true,
            tenantId: true,
            role: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    const formattedEmployee = {
      id: createdEmployee!.id,
      name: createdEmployee!.name || "Без имени",
      email: createdEmployee!.email,
      phone: phone || "+7 (999) 123-45-67",
      position: position || "Сотрудник",
      department: createdEmployee!.point?.name || "Не назначен",
      status: status || "active",
      hireDate: createdEmployee!.createdAt.toISOString(),
      pointId: createdEmployee!.pointId,
      pointName: createdEmployee!.point?.name
    };

    return NextResponse.json(formattedEmployee, { status: 201 });

  } catch (error) {
    console.error("Error creating employee:", error);
    return NextResponse.json({ error: "Failed to create employee" }, { status: 500 });
  }
}