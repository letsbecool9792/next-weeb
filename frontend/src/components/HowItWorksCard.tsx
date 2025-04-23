type HowItWorksCardProps = {
    number: number;
    title: string;
    description: string;
};

const HowItWorksCard = ({ number, title, description }: HowItWorksCardProps) => {
    return (
        <div className="card">
            <div className="number">
                {number}
            </div>
            <h3 className="text-xl font-bold mb-3 mt-2">{title}</h3>
            <p className="text-purple-200">{description}</p>
        </div>
    );
};

export default HowItWorksCard;
  