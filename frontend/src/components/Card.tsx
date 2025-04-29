type CardProps = {
    icon: React.ReactNode;
    title: string;
    description: string;
};

const Card = ({ icon, title, description }: CardProps) => {
    return (
        <div className="card">
            <div className="icon mb-4">{icon}</div>
            <h3 className="text-xl font-bold mb-2">{title}</h3>
            <p className="text-purple-200">{description}</p>
        </div>
    );
};

export default Card;
  