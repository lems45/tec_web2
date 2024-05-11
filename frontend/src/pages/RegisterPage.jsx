import { Button, Card, Container, Input, Label } from "../components/ui";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function RegisterPage() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const { signup, errors: signupErrors } = useAuth();
  const navigate = useNavigate();

  const onSubmit = handleSubmit(async (data) => {
    const user = await signup(data);

    if (user) navigate("/profile");
  });

  return (
    <Container className="h-[calc(100vh-10rem)] flex items-center justify-center">
      <Card>
        {signupErrors &&
          signupErrors.map((err, index) => ( // Added key prop to each p element
            <p key={index} className="bg-red-500 text-white p-2 text-center">{err}</p>
          ))}

        <h3 className="text-2xl font-bold">Register</h3>

        <form onSubmit={onSubmit}>
          <Label htmlFor="name">Username</Label>
          <Input
            placeholder="Enter your username"
            {...register("name", {
              required: true,
            })}
          />

          {errors.name && <p className="text-red-500">name is required</p>}

          <Label htmlFor="email">Email</Label>
          <Input
            type="email"
            placeholder="Enter your email"
            {...register("email", {
              required: true,
            })}
          />
          {errors.email && <p className="text-red-500">email is required</p>}

          <Label htmlFor="password">Password</Label>
          <Input
            type="password"
            placeholder="Enter your password"
            {...register("password", {
              required: true,
            })}
          />
          {errors.password && (
            <p className="text-red-500">password is required</p>
          )}

          <Label>User Type</Label>
          <div className="flex items-center mb-4">
            <Label htmlFor="level">Select User Type</Label>
            <span className="mx-4" />
            <select className="custom-select" {...register("level", {
              valueAsNumber: true,
            })}>
              <option className="custom-option" value={1}>Guardia</option>
              <option className="custom-option" value={2}>Administrador</option>
            </select>
          </div>
          {errors.level && <p className="text-red-500">User type is required</p>}

          <Button>Register</Button>
        </form>
      </Card>
    </Container>
  );
}

export default RegisterPage;
